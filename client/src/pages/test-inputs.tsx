import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TestInputs() {
  const [value, setValue] = useState("");
  
  return (
    <div style={{ padding: "20px", backgroundColor: "white" }}>
      <h1>Input Test Page</h1>
      <div style={{ marginBottom: "20px" }}>
        <label>Test Input:</label>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type here..."
          style={{ marginTop: "10px" }}
        />
        <p>Current value: {value}</p>
      </div>
      
      <Button 
        onClick={() => alert("Button clicked!")}
        style={{ marginRight: "10px" }}
      >
        Test Button
      </Button>
      
      <Button 
        onClick={() => {
          const result = prompt("Enter something:");
          if (result) alert(`You entered: ${result}`);
        }}
      >
        Test Prompt
      </Button>
    </div>
  );
}