export default function Home() {
  return (
    <div style={{ 
      padding: "50px", 
      backgroundColor: "white", 
      minHeight: "100vh",
      position: "relative",
      zIndex: 1
    }}>
      <h1>SIMPLE TEST</h1>
      
      <input
        type="text"
        placeholder="First name"
        style={{ 
          marginTop: "20px", 
          padding: "10px", 
          border: "2px solid blue",
          display: "block",
          width: "300px",
          fontSize: "16px"
        }}
      />
      
      <input
        type="text"
        placeholder="Last name"
        style={{ 
          marginTop: "10px", 
          padding: "10px", 
          border: "2px solid blue",
          display: "block",
          width: "300px",
          fontSize: "16px"
        }}
      />
      
      <button 
        onClick={() => alert("Button works!")}
        style={{ 
          marginTop: "20px",
          padding: "15px 30px",
          backgroundColor: "green",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: "16px"
        }}
      >
        TEST BUTTON
      </button>
    </div>
  );
}