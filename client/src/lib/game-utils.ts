export function getPlayerInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function getPlayerAvatar(displayName: string, index: number) {
  const gradients = [
    "wine-gradient",
    "rose-gradient", 
    "gold-gradient",
    "bg-gradient-to-br from-purple-500 to-pink-500",
    "bg-gradient-to-br from-blue-500 to-cyan-500",
    "bg-gradient-to-br from-green-500 to-emerald-500",
    "bg-gradient-to-br from-orange-500 to-red-500",
    "bg-gradient-to-br from-indigo-500 to-purple-500",
  ];
  
  return gradients[index % gradients.length];
}

export function formatPrice(price: number): string {
  return `$${price}`;
}

export function getRankEmoji(position: number): string {
  switch (position) {
    case 0: return "👑";
    case 1: return "🥈";
    case 2: return "🥉";
    default: return "💰";
  }
}

export function getRankLabel(position: number): string {
  switch (position) {
    case 0: return "Most Expensive";
    case 1: return "#2";
    case 2: return "#3";
    case 3: return "Least Expensive";
    default: return `#${position + 1}`;
  }
}

export function getScoreMessage(points: number, maxPoints: number): string {
  const percentage = (points / maxPoints) * 100;
  
  if (percentage === 100) return "Perfect round! 🎉";
  if (percentage >= 75) return "Excellent tasting! 👏";
  if (percentage >= 50) return "Good job! 👍";
  if (percentage >= 25) return "Not bad! Keep trying! 💪";
  return "Better luck next round! 🤞";
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve();
  }
}
