const express = require("express");
const path = require("path");
const crypto = require("crypto");
const { promisify } = require("util");
const { pool: db, initializeDatabase } = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;
const scrypt = promisify(crypto.scrypt);
const SESSION_COOKIE = "abm_session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const SESSION_SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString("hex");

if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
    console.error("AUTH_SECRET must be set in production.");
    process.exit(1);
}

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

function safeEqual(a, b) {
    const aa = Buffer.from(a);
    const bb = Buffer.from(b);
    return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function sign(payload) {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
    return `${body}.${signature}`;
}
function readSession(req) {
    const cookies = (req.headers.cookie || "").split(";").reduce((acc, part) => {
        const i = part.indexOf("=");
        if (i > -1) acc[part.slice(0, i).trim()] = part.slice(i + 1).trim();
        return acc;
    }, {});
    const token = cookies[SESSION_COOKIE];
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const expected = crypto.createHmac("sha256", SESSION_SECRET).update(parts[0]).digest("base64url");
    if (!safeEqual(parts[1], expected)) return null;
    try {
        const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
        if (!Number.isInteger(payload.userId) || payload.exp < Math.floor(Date.now() / 1000)) return null;
        return { id: payload.userId };
    } catch { return null; }
}
function setSessionCookie(res, userId) {
    const token = sign({ userId, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS });
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`);
}
function clearSessionCookie(res) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`);
}
function requireAuth(req, res, next) {
    const session = readSession(req);
    if (!session) return res.status(401).json({ error: "Please sign in to continue." });
    req.user = session;
    next();
}
function validEmail(email) {
    return typeof email === "string" && email.length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function validId(id) { return /^\d+$/.test(String(id || "")); }

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// AUTHENTICATION
app.get("/api/auth/me", async (req, res) => {
    const session = readSession(req);
    if (!session) return res.status(401).json({ error: "Not signed in." });
    try {
        const result = await db.query("SELECT id, email, full_name FROM users WHERE id = $1", [session.id]);
        if (!result.rows.length) {
            clearSessionCookie(res);
            return res.status(401).json({ error: "Session expired. Please sign in again." });
        }
        return res.json({ user: result.rows[0] });
    } catch (error) {
        console.error("Auth session lookup error:", error.message);
        return res.status(500).json({ error: "Unable to verify session." });
    }
});

app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body || {};
        if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100)
            return res.status(400).json({ error: "Enter your name (2–100 characters)." });
        if (!validEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
        if (typeof password !== "string" || password.length < 10 || password.length > 200)
            return res.status(400).json({ error: "Password must be at least 10 characters." });

        const normalizedEmail = email.trim().toLowerCase();
        const salt = crypto.randomBytes(16).toString("hex");
        const derived = await scrypt(password, salt, 64);
        const passwordHash = `${salt}:${Buffer.from(derived).toString("hex")}`;
        const result = await db.query(
            "INSERT INTO users (email, full_name, password_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING RETURNING id, email, full_name",
            [normalizedEmail, name.trim(), passwordHash]
        );
        if (!result.rows.length) return res.status(409).json({ error: "An account with this email already exists. Please sign in." });
        setSessionCookie(res, result.rows[0].id);
        return res.status(201).json({ user: result.rows[0] });
    } catch (error) {
        console.error("Registration error:", error.message);
        return res.status(500).json({ error: "Could not create your account. Please try again." });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!validEmail(email) || typeof password !== "string")
            return res.status(400).json({ error: "Enter your email and password." });
        const result = await db.query("SELECT id, email, full_name, password_hash FROM users WHERE email = $1", [email.trim().toLowerCase()]);
        if (!result.rows.length) return res.status(401).json({ error: "Incorrect email or password." });
        const user = result.rows[0];
        const [salt, storedHash] = user.password_hash.split(":");
        const derived = await scrypt(password, salt, 64);
        if (!safeEqual(Buffer.from(derived).toString("hex"), storedHash))
            return res.status(401).json({ error: "Incorrect email or password." });
        setSessionCookie(res, user.id);
        return res.json({ user: { id: user.id, email: user.email, full_name: user.full_name } });
    } catch (error) {
        console.error("Login error:", error.message);
        return res.status(500).json({ error: "Could not sign in. Please try again." });
    }
});

app.post("/api/auth/logout", (req, res) => {
    clearSessionCookie(res);
    res.json({ message: "Signed out." });
});

// BUSINESS
app.post("/api/business", requireAuth, async (req, res) => {
    try {
        const { companyName, businessType, ownerName } = req.body || {};
        if (typeof companyName !== "string" || !companyName.trim()) return res.status(400).json({ error: "Company name is required." });
        if (typeof businessType !== "string" || !businessType.trim()) return res.status(400).json({ error: "Business type is required." });
        if (typeof ownerName !== "string" || !ownerName.trim()) return res.status(400).json({ error: "Manager name is required." });
        const clean = [companyName.trim(), businessType.trim(), ownerName.trim()];
        const result = await db.query(
            "INSERT INTO business (company_name, business_type, owner_name, user_id) VALUES ($1, $2, $3, $4) RETURNING id",
            [...clean, req.user.id]
        );
        return res.status(201).json({ message: "Business created successfully.", businessId: result.rows[0].id, companyName: clean[0], businessType: clean[1], ownerName: clean[2] });
    } catch (error) {
        console.error("Business save error:", error.message);
        return res.status(500).json({ error: "Failed to create business." });
    }
});

app.get("/api/business/:id", requireAuth, async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid business ID." });
    try {
        const result = await db.query("SELECT id, company_name, business_type, owner_name FROM business WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
        if (!result.rows.length) return res.status(404).json({ error: "Business not found." });
        const row = result.rows[0];
        return res.json({ businessId: row.id, companyName: row.company_name, businessType: row.business_type, ownerName: row.owner_name });
    } catch (error) {
        console.error("Business retrieval error:", error.message);
        return res.status(500).json({ error: "Failed to retrieve business." });
    }
});

// TRANSACTIONS
app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
        const { businessId, type, category, amount, description, date } = req.body || {};
        if (!validId(businessId)) return res.status(400).json({ error: "A valid business ID is required." });
        if (!["income", "expense"].includes(type)) return res.status(400).json({ error: "Transaction type must be income or expense." });
        if (typeof category !== "string" || !category.trim()) return res.status(400).json({ error: "Transaction category is required." });
        const numericAmount = Number(amount);
        if (amount === undefined || amount === null || amount === "" || !Number.isFinite(numericAmount) || numericAmount <= 0)
            return res.status(400).json({ error: "Amount must be a number greater than zero." });
        if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`)))
            return res.status(400).json({ error: "A valid date in YYYY-MM-DD format is required." });
        if (description != null && typeof description !== "string") return res.status(400).json({ error: "Description must be text." });
        const owner = await db.query("SELECT id FROM business WHERE id = $1 AND user_id = $2", [businessId, req.user.id]);
        if (!owner.rows.length) return res.status(404).json({ error: "Business not found." });
        const result = await db.query(
            "INSERT INTO transactions (business_id, type, category, amount, description, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
            [businessId, type, category.trim(), numericAmount, description ? description.trim() : "", date]
        );
        return res.status(201).json({ message: "Transaction added successfully.", transactionId: result.rows[0].id });
    } catch (error) {
        console.error("Transaction insert error:", error.message);
        return res.status(500).json({ error: "Failed to save transaction." });
    }
});

app.get("/api/transactions/:businessId", requireAuth, async (req, res) => {
    if (!validId(req.params.businessId)) return res.status(400).json({ error: "Invalid business ID." });
    try {
        const owner = await db.query("SELECT id FROM business WHERE id = $1 AND user_id = $2", [req.params.businessId, req.user.id]);
        if (!owner.rows.length) return res.status(404).json({ error: "Business not found." });
        const result = await db.query("SELECT id, business_id, type, category, amount, description, date FROM transactions WHERE business_id = $1 ORDER BY id DESC", [req.params.businessId]);
        return res.json(result.rows);
    } catch (error) {
        console.error("Transaction retrieval error:", error.message);
        return res.status(500).json({ error: "Failed to retrieve transactions." });
    }
});

app.delete("/api/transactions/:id", requireAuth, async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid transaction ID." });
    try {
        const result = await db.query(
            "DELETE FROM transactions t USING business b WHERE t.id = $1 AND t.business_id = b.id AND b.user_id = $2 RETURNING t.id",
            [req.params.id, req.user.id]
        );
        if (!result.rowCount) return res.status(404).json({ error: "Transaction not found." });
        return res.json({ message: "Transaction deleted successfully." });
    } catch (error) {
        console.error("Delete transaction error:", error.message);
        return res.status(500).json({ error: "Failed to delete transaction." });
    }
});

// CUSTOMER CREDIT TRACKING
app.get("/api/credit/:businessId", requireAuth, async (req, res) => {
    if (!validId(req.params.businessId)) return res.status(400).json({ error: "Invalid business ID." });
    try {
        const owner = await db.query("SELECT id FROM business WHERE id = $1 AND user_id = $2", [req.params.businessId, req.user.id]);
        if (!owner.rows.length) return res.status(404).json({ error: "Business not found." });
        const result = await db.query(`
            SELECT c.id, c.name, c.phone, c.opening_balance, c.due_date, c.notes, c.created_at,
                   COALESCE(SUM(p.amount), 0) AS paid_amount,
                   GREATEST(c.opening_balance - COALESCE(SUM(p.amount), 0), 0) AS outstanding
            FROM credit_customers c LEFT JOIN credit_payments p ON p.customer_id = c.id
            WHERE c.business_id = $1
            GROUP BY c.id ORDER BY CASE WHEN c.due_date IS NULL THEN 1 ELSE 0 END, c.due_date ASC, c.id DESC`, [req.params.businessId]);
        return res.json(result.rows);
    } catch (error) { console.error("Credit list error:", error.message); return res.status(500).json({ error: "Could not load customer credit records." }); }
});

app.post("/api/credit", requireAuth, async (req, res) => {
    try {
        const { businessId, name, phone = "", amountOwed, dueDate = "", notes = "" } = req.body || {};
        if (!validId(businessId)) return res.status(400).json({ error: "A valid business ID is required." });
        if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 120) return res.status(400).json({ error: "Customer name must be 2–120 characters." });
        const amount = Number(amountOwed);
        if (!Number.isFinite(amount) || amount < 0 || amount > 9999999999) return res.status(400).json({ error: "Amount owed must be zero or greater." });
        if (typeof phone !== "string" || phone.length > 40 || typeof notes !== "string" || notes.length > 1000) return res.status(400).json({ error: "Check the phone and notes fields." });
        if (dueDate && (typeof dueDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate))) return res.status(400).json({ error: "Due date must use YYYY-MM-DD format." });
        const owner = await db.query("SELECT id FROM business WHERE id = $1 AND user_id = $2", [businessId, req.user.id]);
        if (!owner.rows.length) return res.status(404).json({ error: "Business not found." });
        const result = await db.query("INSERT INTO credit_customers (business_id, name, phone, opening_balance, due_date, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id", [businessId, name.trim(), phone.trim(), amount, dueDate || null, notes.trim()]);
        return res.status(201).json({ message: "Customer credit record saved.", customerId: result.rows[0].id });
    } catch (error) { console.error("Credit create error:", error.message); return res.status(500).json({ error: "Could not save customer credit record." }); }
});

app.post("/api/credit/:customerId/payments", requireAuth, async (req, res) => {
    try {
        const { amount, paymentDate, note = "" } = req.body || {};
        if (!validId(req.params.customerId)) return res.status(400).json({ error: "Invalid customer ID." });
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) return res.status(400).json({ error: "Payment must be greater than zero." });
        if (typeof paymentDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) return res.status(400).json({ error: "Choose a valid payment date." });
        if (typeof note !== "string" || note.length > 500) return res.status(400).json({ error: "Payment note is too long." });
        const customer = await db.query(`SELECT c.id, c.opening_balance, b.user_id FROM credit_customers c JOIN business b ON b.id = c.business_id WHERE c.id = $1 AND b.user_id = $2`, [req.params.customerId, req.user.id]);
        if (!customer.rows.length) return res.status(404).json({ error: "Customer not found." });
        const paid = await db.query("SELECT COALESCE(SUM(amount),0) AS total FROM credit_payments WHERE customer_id = $1", [req.params.customerId]);
        const balance = Math.max(0, Number(customer.rows[0].opening_balance) - Number(paid.rows[0].total));
        if (numericAmount > balance + 0.005) return res.status(400).json({ error: "Payment cannot exceed the outstanding balance." });
        const result = await db.query("INSERT INTO credit_payments (customer_id, amount, payment_date, note) VALUES ($1,$2,$3,$4) RETURNING id", [req.params.customerId, numericAmount, paymentDate, note.trim()]);
        return res.status(201).json({ message: "Payment recorded.", paymentId: result.rows[0].id });
    } catch (error) { console.error("Credit payment error:", error.message); return res.status(500).json({ error: "Could not record payment." }); }
});


// SUPPLIER PAYMENTS WORKSPACE
app.get("/api/suppliers/:businessId", requireAuth, async (req,res) => {
  if (!validId(req.params.businessId)) return res.status(400).json({error:"Invalid business ID."});
  try {
    const owned = await db.query("SELECT id FROM business WHERE id=$1 AND user_id=$2",[req.params.businessId,req.user.id]);
    if (!owned.rows.length) return res.status(404).json({error:"Business not found."});
    const result = await db.query(`
      SELECT s.id,s.name,s.phone,s.notes,
        COALESCE(SUM(b.amount),0)::numeric AS billed,
        COALESCE(SUM(p.paid),0)::numeric AS paid,
        COALESCE(SUM(b.amount),0)-COALESCE(SUM(p.paid),0) AS outstanding
      FROM suppliers s LEFT JOIN supplier_bills b ON b.supplier_id=s.id
      LEFT JOIN (SELECT bill_id,SUM(amount) paid FROM supplier_payments GROUP BY bill_id) p ON p.bill_id=b.id
      WHERE s.business_id=$1 GROUP BY s.id ORDER BY s.name`,[req.params.businessId]);
    res.json(result.rows);
  } catch(e){ console.error("Suppliers list:",e.message); res.status(500).json({error:"Could not load suppliers."});}
});
app.post("/api/suppliers/:businessId", requireAuth, async(req,res)=>{
  const {name,phone="",notes=""}=req.body||{};
  if(!validId(req.params.businessId)||typeof name!=="string"||!name.trim()||name.length>120) return res.status(400).json({error:"Enter a supplier name up to 120 characters."});
  try{
    const own=await db.query("SELECT id FROM business WHERE id=$1 AND user_id=$2",[req.params.businessId,req.user.id]);
    if(!own.rows.length)return res.status(404).json({error:"Business not found."});
    const r=await db.query("INSERT INTO suppliers(business_id,name,phone,notes) VALUES($1,$2,$3,$4) RETURNING id",[req.params.businessId,name.trim(),String(phone).slice(0,40),String(notes).slice(0,500)]);
    res.status(201).json({id:r.rows[0].id,message:"Supplier added."});
  }catch(e){console.error(e.message);res.status(500).json({error:"Could not add supplier."});}
});
app.get("/api/supplier-bills/:businessId",requireAuth,async(req,res)=>{
  if(!validId(req.params.businessId))return res.status(400).json({error:"Invalid business ID."});
  try{
    const r=await db.query(`SELECT b.id,b.supplier_id,s.name supplier_name,b.description,b.amount,b.bill_date,b.due_date,
      COALESCE(p.paid,0)::numeric paid,(b.amount-COALESCE(p.paid,0))::numeric outstanding
      FROM supplier_bills b JOIN suppliers s ON s.id=b.supplier_id
      JOIN business own ON own.id=b.business_id
      LEFT JOIN (SELECT bill_id,SUM(amount) paid FROM supplier_payments GROUP BY bill_id) p ON p.bill_id=b.id
      WHERE b.business_id=$1 AND own.user_id=$2 ORDER BY b.due_date`,[req.params.businessId,req.user.id]);
    res.json(r.rows);
  }catch(e){console.error(e.message);res.status(500).json({error:"Could not load bills."});}
});
app.post("/api/supplier-bills/:businessId",requireAuth,async(req,res)=>{
  const {supplierId,description,amount,dueDate,billDate}=req.body||{};
  const n=Number(amount);
  if(!validId(req.params.businessId)||!validId(supplierId)||typeof description!=="string"||!description.trim()||description.length>255||!Number.isFinite(n)||n<=0||![dueDate,billDate].every(d=>typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)))return res.status(400).json({error:"Check supplier, description, amount and dates."});
  try{
    const r=await db.query(`INSERT INTO supplier_bills(business_id,supplier_id,description,amount,due_date,bill_date)
      SELECT $1,s.id,$3,$4,$5,$6 FROM suppliers s JOIN business b ON b.id=s.business_id
      WHERE s.id=$2 AND s.business_id=$1 AND b.user_id=$7 RETURNING id`,
      [req.params.businessId,supplierId,description.trim(),n,dueDate,billDate,req.user.id]);
    if(!r.rows.length)return res.status(404).json({error:"Supplier not found for this business."});
    res.status(201).json({id:r.rows[0].id,message:"Bill added."});
  }catch(e){console.error(e.message);res.status(500).json({error:"Could not add bill."});}
});
app.post("/api/supplier-bills/:billId/payments",requireAuth,async(req,res)=>{
  const {amount,paymentDate,note=""}=req.body||{}; const n=Number(amount);
  if(!validId(req.params.billId)||!Number.isFinite(n)||n<=0||typeof paymentDate!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate))return res.status(400).json({error:"Enter a valid payment amount and date."});
  try{
    const client=await db.connect(); try{
      await client.query("BEGIN");
      const bill=await client.query(`SELECT b.amount FROM supplier_bills b JOIN business x ON x.id=b.business_id WHERE b.id=$1 AND x.user_id=$2 FOR UPDATE`,[req.params.billId,req.user.id]);
      if(!bill.rows.length){await client.query("ROLLBACK");return res.status(404).json({error:"Bill not found."});}
      const paid=await client.query("SELECT COALESCE(SUM(amount),0) total FROM supplier_payments WHERE bill_id=$1",[req.params.billId]);
      if(n>Number(bill.rows[0].amount)-Number(paid.rows[0].total)+0.005){await client.query("ROLLBACK");return res.status(400).json({error:"Payment exceeds outstanding balance."});}
      await client.query("INSERT INTO supplier_payments(bill_id,amount,payment_date,note) VALUES($1,$2,$3,$4)",[req.params.billId,n,paymentDate,String(note).slice(0,500)]);
      await client.query("COMMIT");res.status(201).json({message:"Payment recorded."});
    }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
  }catch(e){console.error(e.message);res.status(500).json({error:"Could not record payment."});}
});

// INVENTORY WORKSPACE
app.get("/api/inventory/:businessId",requireAuth,async(req,res)=>{
 if(!validId(req.params.businessId))return res.status(400).json({error:"Invalid business ID."});
 try{const r=await db.query(`SELECT i.*,(i.quantity*i.unit_cost)::numeric AS stock_value,
 (i.quantity<=i.low_stock_threshold) AS low_stock FROM inventory_items i JOIN business b ON b.id=i.business_id WHERE i.business_id=$1 AND b.user_id=$2 ORDER BY i.name`,[req.params.businessId,req.user.id]);res.json(r.rows);}
 catch(e){console.error(e.message);res.status(500).json({error:"Could not load inventory."});}
});
app.post("/api/inventory/:businessId",requireAuth,async(req,res)=>{
 const {name,sku="",quantity=0,unitCost=0,lowStockThreshold=5}=req.body||{};
 const q=Number(quantity),c=Number(unitCost),t=Number(lowStockThreshold);
 if(!validId(req.params.businessId)||typeof name!=="string"||!name.trim()||name.length>150||![q,c,t].every(Number.isFinite)||q<0||c<0||t<0)return res.status(400).json({error:"Enter valid product details and non-negative numbers."});
 try{const own=await db.query("SELECT id FROM business WHERE id=$1 AND user_id=$2",[req.params.businessId,req.user.id]);if(!own.rows.length)return res.status(404).json({error:"Business not found."});
 const r=await db.query(`INSERT INTO inventory_items(business_id,name,sku,quantity,unit_cost,low_stock_threshold) VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,[req.params.businessId,name.trim(),String(sku).slice(0,80),q,c,t]);res.status(201).json({id:r.rows[0].id,message:"Inventory item added."});}
 catch(e){console.error(e.message);res.status(500).json({error:"Could not add inventory item."});}
});
app.patch("/api/inventory/items/:itemId",requireAuth,async(req,res)=>{
 const {quantity,unitCost,lowStockThreshold}=req.body||{};
 const q=Number(quantity),c=Number(unitCost),t=Number(lowStockThreshold);
 if(!validId(req.params.itemId)||![q,c,t].every(Number.isFinite)||q<0||c<0||t<0)return res.status(400).json({error:"Enter valid non-negative values."});
 try{const r=await db.query(`UPDATE inventory_items i SET quantity=$1,unit_cost=$2,low_stock_threshold=$3,updated_at=CURRENT_TIMESTAMP FROM business b WHERE i.business_id=b.id AND i.id=$4 AND b.user_id=$5 RETURNING i.id`,[q,c,t,req.params.itemId,req.user.id]);if(!r.rows.length)return res.status(404).json({error:"Inventory item not found."});res.json({message:"Inventory updated."});}
 catch(e){console.error(e.message);res.status(500).json({error:"Could not update inventory."});}
});

// CASH-FLOW INTELLIGENCE: combines transaction, credit and supplier liabilities.
app.get("/api/cashflow/:businessId",requireAuth,async(req,res)=>{
 if(!validId(req.params.businessId))return res.status(400).json({error:"Invalid business ID."});
 try{
 const own=await db.query("SELECT id FROM business WHERE id=$1 AND user_id=$2",[req.params.businessId,req.user.id]);if(!own.rows.length)return res.status(404).json({error:"Business not found."});
 const tx=await db.query(`SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END),0)::numeric net,
 COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0)::numeric income,
 COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0)::numeric expenses FROM transactions WHERE business_id=$1`,[req.params.businessId]);
 const credit=await db.query(`SELECT COALESCE(SUM(c.opening_balance),0)-COALESCE((SELECT SUM(p.amount) FROM credit_payments p JOIN credit_customers c2 ON c2.id=p.customer_id WHERE c2.business_id=$1),0) AS receivable FROM credit_customers c WHERE c.business_id=$1`,[req.params.businessId]);
 const suppliers=await db.query(`SELECT COALESCE(SUM(b.amount-COALESCE(p.paid,0)),0)::numeric payable,
 COALESCE(SUM(CASE WHEN b.due_date<CURRENT_DATE AND b.amount-COALESCE(p.paid,0)>0 THEN b.amount-COALESCE(p.paid,0) ELSE 0 END),0)::numeric overdue
 FROM supplier_bills b LEFT JOIN (SELECT bill_id,SUM(amount) paid FROM supplier_payments GROUP BY bill_id) p ON p.bill_id=b.id WHERE b.business_id=$1`,[req.params.businessId]);
 const net=Number(tx.rows[0].net),receivable=Math.max(0,Number(credit.rows[0].receivable)),payable=Number(suppliers.rows[0].payable),overdue=Number(suppliers.rows[0].overdue);
 res.json({income:Number(tx.rows[0].income),expenses:Number(tx.rows[0].expenses),recordedNet:net,customerReceivables:receivable,supplierPayables:payable,overdueSupplierBills:overdue,adjustedPotentialPosition:net+receivable-payable,signals:[...(overdue>0?["Prioritize overdue supplier bills."]:[]),...(receivable>0?["Follow up on customer balances to improve cash collection."]:[]),...(net<0?["Recorded expenses exceed recorded income."]:[]),...(overdue===0&&receivable===0&&net>=0?["No overdue supplier bills or customer credit detected in the current records."]:[])]});
 }catch(e){console.error(e.message);res.status(500).json({error:"Could not calculate cash-flow intelligence."});}
});

// OPTIONAL AI PROVIDER: Gemini API key stays server-side in GEMINI_API_KEY.
// Rule-based advice remains available when no key is configured.
app.post("/api/ai/ask",requireAuth,async(req,res)=>{
 const {businessId,question}=req.body||{};
 if(!validId(businessId)||typeof question!=="string"||!question.trim()||question.length>1000)return res.status(400).json({error:"Enter a question up to 1,000 characters."});
 try{
 const own=await db.query("SELECT id FROM business WHERE id=$1 AND user_id=$2",[businessId,req.user.id]);if(!own.rows.length)return res.status(404).json({error:"Business not found."});
 const data=await db.query(`SELECT type,category,amount,date,description FROM transactions WHERE business_id=$1 ORDER BY date DESC LIMIT 200`,[businessId]);
 const totals=await db.query(`SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) income,COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) expenses FROM transactions WHERE business_id=$1`,[businessId]);
 const context={income:Number(totals.rows[0].income),expenses:Number(totals.rows[0].expenses),net:Number(totals.rows[0].income)-Number(totals.rows[0].expenses),recentTransactions:data.rows};
 if(!process.env.GEMINI_API_KEY)return res.json({mode:"rule-based",answer:`Current recorded income: ₹${context.income.toFixed(2)}. Expenses: ₹${context.expenses.toFixed(2)}. Net: ₹${context.net.toFixed(2)}. ${context.net<0?"Recorded expenses exceed income; review costs and collection timing.":"Review upcoming bills and customer balances before spending available cash."} Configure GEMINI_API_KEY to enable optional AI-generated answers.`});
 const response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="+encodeURIComponent(process.env.GEMINI_API_KEY),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:"You are a careful small-business assistant. Give practical, concise guidance based only on provided data. Do not claim to be a certified accountant or guarantee outcomes. Currency INR. Data: "+JSON.stringify(context)+"\\nUser question: "+question.trim()}]}]})});
 const payload=await response.json();if(!response.ok)return res.status(502).json({error:"AI provider request failed. Check API key and provider quota."});
 const answer=payload.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("\\n").trim();
 res.json({mode:"gemini",answer:answer||"The AI provider returned no answer."});
 }catch(e){console.error("AI request:",e.message);res.status(500).json({error:"Could not generate an answer."});}
});


// SUMMARY
app.get("/api/summary/:businessId", requireAuth, async (req, res) => {
    if (!validId(req.params.businessId)) return res.status(400).json({ error: "Invalid business ID." });
    try {
        const result = await db.query(
            `SELECT
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses,
                COALESCE(SUM(CASE WHEN type = 'income' AND date = CURRENT_DATE THEN amount ELSE 0 END), 0) AS today_income,
                COALESCE(SUM(CASE WHEN type = 'expense' AND date = CURRENT_DATE THEN amount ELSE 0 END), 0) AS today_expenses
             FROM transactions t
             JOIN business b ON b.id = t.business_id
             WHERE t.business_id = $1 AND b.user_id = $2`,
            [req.params.businessId, req.user.id]
        );
        const income = Number(result.rows[0].income), expenses = Number(result.rows[0].expenses);
        const todayIncome = Number(result.rows[0].today_income), todayExpenses = Number(result.rows[0].today_expenses);
        const profit = income - expenses, todayProfit = todayIncome - todayExpenses;
        return res.json({
            income, expenses, profit,
            profitMargin: income > 0 ? (profit / income) * 100 : 0,
            todayIncome, todayExpenses, todayProfit,
            todayProfitMargin: todayIncome > 0 ? (todayProfit / todayIncome) * 100 : 0
        });
    } catch (error) {
        console.error("Summary error:", error.message);
        return res.status(500).json({ error: "Failed to calculate summary." });
    }
});

// WEEKLY ANALYTICS
app.get("/api/analytics/weekly/:businessId", requireAuth, async (req, res) => {
    if (!validId(req.params.businessId)) return res.status(400).json({ error: "Invalid business ID." });
    try {
        const result = await db.query(
            `SELECT date,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
             FROM transactions t
             JOIN business b ON b.id = t.business_id
             WHERE t.business_id = $1 AND b.user_id = $2
               AND date >= CURRENT_DATE - INTERVAL '6 days'
             GROUP BY date ORDER BY date ASC`,
            [req.params.businessId, req.user.id]
        );
        return res.json(result.rows.map(row => {
            const income = Number(row.income), expenses = Number(row.expenses);
            return { date: row.date, income, expenses, profit: income - expenses };
        }));
    } catch (error) {
        console.error("Weekly analytics error:", error.message);
        return res.status(500).json({ error: "Failed to calculate weekly analytics." });
    }
});

async function startServer() {
    try {
        await initializeDatabase();
        app.listen(PORT, "0.0.0.0", () => console.log(`Server is running on port ${PORT}`));
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
}
startServer();
