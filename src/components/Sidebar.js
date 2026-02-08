const Sidebar = ({ isRight = false, items }) => {
  const sidebarStyles = {
    position: 'sticky',
    top: 0,
    height: '100vh',
    background: 'linear-gradient(180deg, rgba(20, 20, 30, 0.95) 0%, rgba(15, 15, 25, 0.9) 100%)',
    backdropFilter: 'blur(12px)',
    borderRight: isRight ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
    borderLeft: isRight ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3rem',
    padding: '2rem 1rem',
    fontWeight: 800,
    fontSize: '0.75rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    textAlign: 'center',
    writingMode: 'horizontal-tb'
  };

  const spanStyles = {
    transform: 'none',
    writingMode: 'horizontal-tb',
    padding: '0.5rem 0',
    width: '100%',
    position: 'relative',
    zIndex: 1,
    transition: 'all 0.4s ease',
    color: isRight ? '#00e5ff' : '#00e5ff',
    textShadow: isRight 
      ? '0 0 8px rgba(106, 92, 255, 0.4), 0 0 15px rgba(255, 255, 255, 0.2)' 
      : '0 0 8px rgba(0, 229, 255, 0.5), 0 0 15px rgba(255, 255, 255, 0.2)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  };

  return (
    <aside className="sidebar-label" style={sidebarStyles}>
      {items.map((item, index) => (
        <span key={index} style={spanStyles}>
          {item}
        </span>
      ))}
    </aside>
  );
};

export default Sidebar;