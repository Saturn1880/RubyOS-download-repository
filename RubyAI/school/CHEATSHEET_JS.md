# JavaScript cheatsheet (Ruby's quick reference)

```js
// Find things
const el = document.getElementById("thing");
const all = document.querySelectorAll(".card");

// React to people
el.onclick = () => { /* do something */ };
el.addEventListener("keydown", e => { if (e.key === "Enter") go(); });

// Change the page
el.textContent = "safe text";            // never injects HTML
el.style.background = "#e0112b";
const d = document.createElement("div"); // build new elements
parent.appendChild(d);

// Remember things
localStorage.setItem("notes", text);
const saved = localStorage.getItem("notes");

// Dragging (windows) in one idea:
// pointerdown: remember offset → pointermove: set left/top → pointerup: stop.

// Games in one idea:
// requestAnimationFrame(loop) → read keys → move things →
// check overlaps → draw → repeat. Score/lives live in variables.
```

Rules: every listener must exist for a reason; test the flow in order;
if a value can be text the user typed, put it in with `textContent`.
