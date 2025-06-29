export default function TestInputs() {
  return (
    <div style={{ 
      padding: "20px", 
      backgroundColor: "white", 
      minHeight: "100vh",
      position: "relative",
      zIndex: 9999,
      pointerEvents: "auto"
    }}>
      <h1>EMERGENCY TEST - NO REACT STATE</h1>
      <div style={{ marginBottom: "20px" }}>
        <label>Pure HTML Input:</label>
        <input
          type="text"
          placeholder="Type here..."
          style={{ 
            marginTop: "10px", 
            padding: "10px", 
            border: "2px solid red",
            display: "block",
            width: "300px",
            fontSize: "16px",
            pointerEvents: "auto"
          }}
          onInput={(e) => {
            const target = e.target as HTMLInputElement;
            const display = document.getElementById('display');
            if (display) display.textContent = `Value: "${target.value}"`;
          }}
        />
        <p id="display" style={{ marginTop: "10px" }}>Value: ""</p>
      </div>
      
      <button 
        onClick={() => alert("Button works!")}
        style={{ 
          marginRight: "10px",
          padding: "10px 20px",
          backgroundColor: "blue",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          pointerEvents: "auto"
        }}
      >
        Alert Test
      </button>
      
      <div style={{ marginTop: "20px", fontSize: "14px" }}>
        <p>This bypasses all React state and custom CSS. If this doesn't work, the browser itself is blocked.</p>
      </div>
    </div>
  );
}