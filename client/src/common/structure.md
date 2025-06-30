# UI Component Structure

All components must follow:

1. File Naming:
   - PascalCase for components (Button.tsx)
   - kebab-case for assets (header-icon.svg)

2. Folder Structure:
   ComponentName/
   ├── ComponentName.tsx  # Main component
   ├── index.ts           # Barrel exports
   ├── types.ts           # Type definitions
   ├── hooks.ts           # Component-specific hooks
   └── styles.module.css  # CSS Modules (optional)

3. Required Props:
   - Add `data-testid` for testing
   - Include `className` prop
