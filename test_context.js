async function test() {
  const res = await fetch("http://localhost:3000/api/generate-letter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
        story: "I got laid off yesterday after 10 years of loyal service. I feel like my entire identity is gone and I am useless.", 
        isPremium: true 
    })
  });
  const data = await res.json();
  console.log("=== GENERATED LETTER CONTENT ===");
  console.log(data.letter);
  console.log("\n=== ACTION STEP ===");
  console.log(data.action);
}
test();
