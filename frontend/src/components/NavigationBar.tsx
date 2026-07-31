import { useState } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarToggler,
  Collapse,
  Nav,
  NavItem,
  Input,
  Button,
  Form,
  Badge,
} from "reactstrap";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";

const NavigationBar = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { username, setUsername, clearUser, loading } = useUser();

  const toggle = () => setIsOpen(!isOpen);

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const name = userInput.trim();
    if (!name) return;
    setUsername(name);
    navigate(`/user/${name}`);
    setUserInput("");
  };

  const handleClearUser = () => {
    if (location.pathname.startsWith("/user")) {
      navigate("/");
      setTimeout(() => {
        clearUser();
      }, 50);
    } else {
      clearUser();
    }
  };

  const isDark = theme === "dark";

  return (
    <Navbar
      color={isDark ? "dark" : "light"}
      dark={isDark}
      light={!isDark}
      expand="md"
      className="px-3"
    >
      <NavbarBrand tag={NavLink} to="/">
        AtCoder AI Tags
      </NavbarBrand>

      <NavbarToggler onClick={toggle} />

      <Collapse isOpen={isOpen} navbar>
        <Nav className="me-auto" navbar>
          <NavItem>
            <NavLink to="/list" className="nav-link">
              List
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/table" className="nav-link">
              Table
            </NavLink>
          </NavItem>
          {username && (
            <NavItem>
              <NavLink to={`/user/${username}`} className="nav-link">
                Profile
              </NavLink>
            </NavItem>
          )}
        </Nav>

        {username ? (
          <div className="d-flex align-items-center me-2 gap-2 mt-2 mt-md-0">
            <Badge color="success" pill>
              {loading ? "Loading..." : `@${username}`}
            </Badge>
            <Button
              color="secondary"
              outline
              size="sm"
              onClick={handleClearUser}
              title="Sign out"
            >
              Clear
            </Button>
          </div>
        ) : (
          <Form
            onSubmit={handleUserSearch}
            className="d-flex me-2 mt-2 mt-md-0"
            role="search"
          >
            <Input
              id="navbar-username-input"
              type="text"
              placeholder="AtCoder username..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="me-2"
              bsSize="sm"
            />
            <Button color="primary" size="sm" type="submit">
              Go
            </Button>
          </Form>
        )}

        <Button
          color={isDark ? "light" : "dark"}
          outline
          size="sm"
          onClick={toggleTheme}
          className="mt-2 mt-md-0"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? "Light" : "Dark"}
        </Button>

        {/* GitHub Logo Link */}
        <a
          href="https://github.com/AbhinayShankhdhar/At_Coder_Competitive_Programmer"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source on GitHub"
          title="View source on GitHub"
          className={`d-flex align-items-center ms-md-3 mt-3 mt-md-0 text-${isDark ? "light" : "dark"}`}
          style={{
            textDecoration: "none",
            transition: "opacity 0.2s",
            opacity: 0.8,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
      </Collapse>
    </Navbar>
  );
};

export default NavigationBar;
