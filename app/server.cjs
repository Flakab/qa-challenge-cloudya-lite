const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Mock users ---
const users = [
  { email: 'admin@cloudya.com', password: 'Test1234!' },
  { email: 'user@cloudya.com', password: 'Welcome1!' }
];

// --- Mock contacts ---
const contacts = [
  { id: 1, name: 'Anna Schmidt', email: 'anna.schmidt@nfon.com', phone: '+49 170 1234567', department: 'Engineering' },
  { id: 2, name: 'Max Müller', email: 'max.mueller@nfon.com', phone: '+49 171 9876543', department: 'Sales' },
  { id: 3, name: 'Lisa Weber', email: 'lisa.weber@nfon.com', phone: '+49 172 5551234', department: 'Support' },
  { id: 4, name: 'Jörg Überall', email: 'joerg.ueberall@nfon.com', phone: '+49 173 4445556', department: 'Engineering' },
  { id: 5, name: 'Ärzte Özil', email: 'aerzte.oezil@nfon.com', phone: '+49 174 7778889', department: 'Marketing' }
];

let sessions = {};

// --- AUTH ---

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.json({ success: false, message: 'Invalid credentials' });
  }

  const token = 'tok_' + Math.random().toString(36).substring(2);
  sessions[token] = { email: user.email };

  res.json({ success: true, token, user: { email: user.email, password: user.password } });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) delete sessions[token];
  res.json({ success: true });
});

// --- CONTACTS ---

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && !sessions[token]) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.user = sessions[token];
  next();
}

app.get('/api/contacts', authMiddleware, (req, res) => {
  const search = req.query.q;

  if (search) {
    const results = contacts.filter(c =>
      c.name.includes(search) || c.email.includes(search) || c.department.includes(search)
    );
    return res.json(results);
  }

  res.json(contacts);
});

app.get('/api/contacts/:id', authMiddleware, (req, res) => {
  const contact = contacts.find(c => c.id == req.params.id);
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  res.json(contact);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
