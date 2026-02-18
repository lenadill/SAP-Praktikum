const button = document.getElementById("openForm");
const formContainer = document.getElementById("formContainer");
const form = formContainer.querySelector("form");
const table = document.querySelector("table");

// Formular anzeigen
button.addEventListener("click", () => {
  formContainer.style.display = "block";
});

// Formular absenden
form.addEventListener("submit", (e) => {
  e.preventDefault(); // Seite wird nicht neu geladen

  // Werte aus Feldern auslesen
  const betrag = document.getElementById("feld1").value;
  const kategorie = document.getElementById("feld2").value;
  const datum = document.getElementById("feld3").value;

  // Neue Tabellenzeile erstellen
  const newRow = document.createElement("tr");

  newRow.innerHTML = `
    <td>${betrag}</td>
    <td>${kategorie}</td>
    <td>${datum}</td>
  `;

  table.appendChild(newRow); // Zeile zur Tabelle hinzufügen

  // Formular wird ausgeblendet
  form.reset();
  formContainer.style.display = "none";
});
