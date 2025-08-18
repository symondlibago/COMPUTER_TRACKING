# PC Monitor Pro - Computer Lab Management System

A modern, mobile-friendly computer monitoring system built with React (Vite + JSX), Tailwind CSS, and Framer Motion. Features a bold homepage with high-energy visuals, comprehensive admin interface, and intuitive student portal with intelligent queue management.

## 🚀 Features

### Homepage
- **Bold Design**: High-energy visuals with electric blue/red color scheme
- **Strong Typography**: Gradient text effects and modern fonts
- **Smooth Animations**: Framer Motion powered transitions
- **Mobile Responsive**: Optimized for all device sizes

### Admin Interface
- **Real-time Dashboard**: Live PC status monitoring with statistics
- **PC Management**: Add, remove, and update computer workstations
- **Student Management**: Register and manage student accounts
- **Usage Analytics**: Track lab utilization and generate reports
- **Collapsible Sidebar**: Clean navigation with organized menu items
- **Queue Monitoring**: Real-time view of student queue status

### Student Portal
- **PC Availability Viewer**: See all available computers at a glance
- **Smart Sign-in**: Select and sign into available PCs
- **Session Dashboard**: Real-time countdown timer and session controls
- **Auto Queue System**: FIFO queue with 5-minute sign-in timeout
- **Mobile Optimized**: Touch-friendly interface for mobile devices

## 🛠️ Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: React Context API
- **Build Tool**: Vite
- **Package Manager**: npm

## 📦 Installation & Setup

1. **Extract the project files**
   ```bash
   unzip pc-monitoring-system.zip
   cd pc-monitoring-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

## 🎯 Usage

### For Administrators
1. Navigate to the admin dashboard
2. Monitor real-time PC status and lab utilization
3. Manage student registrations and PC assignments
4. View queue status and usage analytics
5. Generate reports for lab optimization

### For Students
1. Sign in with your student credentials
2. View available computers in the lab
3. Select and sign into an available PC
4. Use the session timer to track your usage
5. Join the queue when no PCs are available

## 🏗️ Project Structure

```
pc-monitoring-system/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Layout components
│   │   ├── pages/           # Main page components
│   │   └── features/        # Feature-specific components
│   ├── context/             # React Context for state management
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── assets/              # Images and static assets
│   └── utils/               # Helper utilities
├── dist/                    # Production build output
├── public/                  # Public assets
└── package.json             # Project dependencies
```

## 🎨 Design System

### Color Palette
- **Primary**: Electric Blue (#0EA5E9)
- **Secondary**: Red (#EF4444)
- **Background**: Black (#000000)
- **Text**: White (#FFFFFF)
- **Accent**: Various gradients and highlights

### Typography
- **Headings**: Bold, modern sans-serif
- **Body**: Clean, readable fonts
- **Special Effects**: Gradient text for emphasis

## 🔧 Key Components

### State Management
- Global state using React Context
- Actions for PC assignment, queue management, and user authentication
- Real-time updates across all components

### Queue System
- FIFO (First In, First Out) algorithm
- 5-minute timeout for PC sign-in
- Automatic queue position updates
- Real-time notifications

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Touch-optimized controls
- Adaptive typography

## 🚀 Deployment

The project includes a pre-built production version in the `dist/` folder. You can:

1. **Static Hosting**: Upload the `dist/` folder to any static hosting service
2. **Local Server**: Use `npm run preview` to test the production build
3. **Custom Deployment**: Integrate with your preferred deployment pipeline

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

This is a complete, production-ready application. For customizations:

1. Modify the state structure in `src/context/AppContext.jsx`
2. Update styling in component files or `src/App.css`
3. Add new features in the `src/components/features/` directory
4. Customize the color scheme in Tailwind configuration

## 📄 License

This project is provided as-is for educational and commercial use.

## 🎉 Acknowledgments

Built with modern web technologies and best practices for performance, accessibility, and user experience.

---

**PC Monitor Pro** - Transforming computer lab management with intelligent monitoring and queue systems.

