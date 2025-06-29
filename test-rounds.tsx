// Temporary test component to debug rounds issue
import WineyHeader from "@/common/winey-header";

export default function TestRounds() {
  return (
    <div className="min-h-screen bg-gray-50">
      <WineyHeader />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Test Rounds Page
        </h1>
        <p className="text-gray-600 text-center">
          This is a simple test to see if the rounds route works
        </p>
      </div>
    </div>
  );
}