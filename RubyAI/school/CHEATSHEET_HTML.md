# HTML cheatsheet (Ruby's quick reference)

| Tag | Job |
|---|---|
| `<h1>`…`<h6>` | Headings, biggest to smallest |
| `<p>` | Paragraph |
| `<div>` | A box/section |
| `<span>` | Inline piece of text |
| `<button>` | Clickable button |
| `<input>` | Typing box (`type="text"`, `"color"`, `"range"`, `"checkbox"`…) |
| `<textarea>` | Big typing area |
| `<img src="…">` | Picture |
| `<a href="…">` | Link |
| `<ul>` / `<ol>` + `<li>` | Lists |
| `<canvas>` | Drawing/game surface (JavaScript draws on it) |
| `<select>` + `<option>` | Dropdown |
| `id="x"` | Name one element so JS/CSS can find it |
| `class="y"` | Group elements for shared styling |

Skeleton of every complete page:

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Title</title><style>/* looks */</style></head>
<body><!-- what you see -->
<script>// what it does</script></body></html>
```
