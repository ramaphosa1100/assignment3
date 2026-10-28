// ---------- Stack data structure (LIFO) ----------
class Stack {
  constructor() { this.items = []; }
  push(x) { this.items.push(x); }
  pop() {
    if (this.isEmpty()) throw new Error("Stack is empty");
    return this.items.pop();
  }
  peek() { return this.items[this.items.length - 1]; }
  isEmpty() { return this.items.length === 0; }
  clear() { this.items = []; }
  get size() { return this.items.length; }
}

// ---------- Editor built on two stacks ----------
class TextEditor {
  constructor() {
    this.text = "";
    this.undoStack = new Stack(); // past versions
    this.redoStack = new Stack(); // undone versions
  }
  edit(next) {
    this.undoStack.push(this.text);   // save state BEFORE the change
    this.text = next;
    const dropped = this.redoStack.size;
    this.redoStack.clear();           // a new edit invalidates redo history
    return dropped;
  }
  undo() {
    this.redoStack.push(this.text);
    this.text = this.undoStack.pop();
  }
  redo() {
    this.undoStack.push(this.text);
    this.text = this.redoStack.pop();
  }
}

// ---------- UI ----------
const ed = new TextEditor();
const $ = id => document.getElementById(id);
let enter = null; // which stack just received an item (for the drop animation)

function q(s) { return s === "" ? "empty text" : "“" + s + "”"; }

function say(msg, isErr) {
  const el = $("log");
  el.textContent = msg;
  el.className = isErr ? "err" : "";
}

function drawStack(listId, countId, stack, name) {
  const ol = $(listId);
  ol.textContent = "";
  $(countId).textContent = "(" + stack.size + ")";
  if (stack.isEmpty()) {
    const p = document.createElement("li");
    p.className = "none";
    p.textContent = "Empty";
    ol.appendChild(p);
    return;
  }
  for (let i = stack.items.length - 1; i >= 0; i--) {
    const li = document.createElement("li");
    const v = stack.items[i];
    li.textContent = v === "" ? "(empty text)" : v;
    if (v === "") li.classList.add("blank");
    if (i === stack.items.length - 1) {
      li.classList.add("top");
      li.title = "Top of stack";
      if (enter === name) li.classList.add("enter");
    }
    ol.appendChild(li);
  }
}

function render() {
  const d = $("doc");
  d.textContent = ed.text === "" ? "Empty document" : ed.text;
  d.className = ed.text === "" ? "empty" : "";
  drawStack("us", "uc", ed.undoStack, "undo");
  drawStack("rs", "rc", ed.redoStack, "redo");
  $("undo").disabled = ed.undoStack.isEmpty();
  $("redo").disabled = ed.redoStack.isEmpty();
  $("del").disabled = ed.text.trim() === "";
  enter = null;
}

function add() {
  const v = $("inp").value.trim();
  if (!v) { say("Type some text first, then choose Add text.", true); $("inp").focus(); return; }
  const prev = ed.text;
  const dropped = ed.edit(prev === "" ? v : prev + " " + v);
  enter = "undo";
  say("Pushed " + q(prev) + " onto Undo." + (dropped ? " Redo emptied (" + dropped + " dropped)." : ""));
  $("inp").value = "";
  render();
}

function del() {
  if (ed.text.trim() === "") return;
  const prev = ed.text;
  const dropped = ed.edit(prev.replace(/\s*\S+\s*$/, ""));
  enter = "undo";
  say("Pushed " + q(prev) + " onto Undo." + (dropped ? " Redo emptied (" + dropped + " dropped)." : ""));
  render();
}

function undo() {
  if (ed.undoStack.isEmpty()) { say("Nothing to undo. The Undo stack is empty.", true); return; }
  const cur = ed.text;
  ed.undo();
  enter = "redo";
  say("Pushed " + q(cur) + " onto Redo, popped " + q(ed.text) + " from Undo.");
  render();
}

function redo() {
  if (ed.redoStack.isEmpty()) { say("Nothing to redo. The Redo stack is empty.", true); return; }
  const cur = ed.text;
  ed.redo();
  enter = "undo";
  say("Pushed " + q(cur) + " onto Undo, popped " + q(ed.text) + " from Redo.");
  render();
}

$("add").addEventListener("click", add);
$("del").addEventListener("click", del);
$("undo").addEventListener("click", undo);
$("redo").addEventListener("click", redo);
$("inp").addEventListener("keydown", e => { if (e.key === "Enter") add(); });
document.addEventListener("keydown", e => {
  if (!(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase();
  if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
  else if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
});

render();