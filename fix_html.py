path = "index.html"
with open(path, encoding="utf-8") as f:
    c = f.read()

wrong_close = "</" + "motion>"
right_close = "</" + "div>"
needle = 'id="adminPlanEditName" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:8px;">' + wrong_close
replacement = 'id="adminPlanEditName" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:8px;">' + right_close
if needle in c:
    c = c.replace(needle, replacement)
    print("Fixed adminPlanEditName closing tag")
else:
    print("Needle not found:", repr(needle[:80]))

with open(path, "w", encoding="utf-8") as f:
    f.write(c)
