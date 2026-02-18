css = """
.context-menu {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    width: 150px;
    padding: 5px 0;
    border: 1px solid #ddd;
}
.context-menu-list {
    list-style: none;
    margin: 0;
    padding: 0;
}
.context-menu-list li {
    padding: 10px 15px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
}
.context-menu-list li:hover {
    background: #f5f5f5;
}
.context-menu-list li.delete-opt:hover {
    background: #fff0f0;
}
"""
with open("../App/static/css/style.css", "a", encoding="utf-8") as f:
    f.write(css)
