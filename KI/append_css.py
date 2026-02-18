css_to_add = """
/* Modal Styling */
.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
    backdrop-filter: blur(5px);
}
.modal-content {
    background-color: white;
    margin: 10% auto;
    padding: 30px;
    border-radius: 15px;
    width: 350px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    position: relative;
    animation: slideDown 0.3s ease-out;
}
@keyframes slideDown {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
.modal-header {
    margin-bottom: 20px;
    color: #0070d2;
    font-size: 1.5em;
    font-weight: bold;
}
.form-group {
    margin-bottom: 15px;
}
.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    font-size: 0.9em;
}
.form-group input, .form-group select {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    box-sizing: border-box;
    font-size: 1em;
}
.modal-footer {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
.btn {
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    border: none;
    font-weight: bold;
}
.btn-cancel { background: #eee; }
.btn-submit { background: #0070d2; color: white; }
.text-positive { color: #28a745; }
.text-negative { color: #dc3545; }
"""
with open("../App/static/css/style.css", "a", encoding="utf-8") as f:
    f.write(css_to_add)
