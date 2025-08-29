function downloadMedia() {
  let link = document.getElementById("instaLink").value;
  if(link === "") {
    alert("⚠️ Please enter a valid Instagram link");
    return;
  }
  
  // Demo only
  document.getElementById("result").innerHTML = `
    <p>🔗 You entered:</p>
    <a href="${link}" target="_blank">${link}</a>
    <p>(Backend required to fetch actual download link)</p>
  `;
}