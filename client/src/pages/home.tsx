import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleCreateGame = () => {
    alert(`Creating game for: ${firstName} ${lastName}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">WINEY - The Ultimate Taste Test</h1>
        
        <div className="space-y-4">
          <div>
            <Label>Are you hosting a blind tasting? Enter your...</Label>
          </div>
          
          <Input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          
          <Input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          
          <Button 
            onClick={handleCreateGame}
            disabled={!firstName.trim() || !lastName.trim()}
            className="w-full"
          >
            Let's Get Started!
          </Button>
        </div>
        
        <p className="mt-4 text-sm text-gray-600">
          First name: {firstName}<br />
          Last name: {lastName}
        </p>
      </div>
    </div>
  );
}