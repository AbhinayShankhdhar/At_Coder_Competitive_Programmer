import { useEffect } from "react";
import {
  Container,
  Alert,
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  CardText,
  Button,
} from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useUser } from "../context/UserContext";

const HomePage = () => {
  const navigate = useNavigate();
  const { username } = useUser();

  const handleGetStarted = () => {
    if (username) {
      navigate(`/user/${username}`);
    } else {
      const inputElement = document.getElementById("navbar-username-input");
      if (inputElement) {
        inputElement.focus();
        inputElement.classList.add("is-invalid");
        setTimeout(() => inputElement.classList.remove("is-invalid"), 1000);
      }
    }
  };

  useEffect(() => {
    void api.contests().catch(() => {});
    void api.allProblems().catch(() => {});
    void api.difficulties().catch(() => {});
    void api.tags().catch(() => {});
  }, []);

  return (
    <Container className="mt-4 mb-5">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-2">AtCoder AI Tagged Problems</h1>
          <p className="text-muted">
            Browse, filter, and track your progress on AtCoder problems with
            AI-generated topic tags.
          </p>
          <Alert color="info" className="mb-0">
            Enter your AtCoder username in the navigation bar to highlight
            solved problems across the List and Table views.
          </Alert>
        </Col>
      </Row>

      <Row className="g-3">
        <Col md={4}>
          <Card className="h-100">
            <CardBody>
              <CardTitle tag="h5">Problem List</CardTitle>
              <CardText>
                Search and filter the full problem set by AI-detected tag,
                difficulty, or contest identifier.
              </CardText>
              <Link to="/list">
                <Button color="primary" outline size="sm">
                  Open List
                </Button>
              </Link>
            </CardBody>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <CardBody>
              <CardTitle tag="h5">Contest Table</CardTitle>
              <CardText>
                Browse problems organised by contest with difficulty colours and
                inline tag badges.
              </CardText>
              <Link to="/table">
                <Button color="primary" outline size="sm">
                  Open Table
                </Button>
              </Link>
            </CardBody>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <CardBody>
              <CardTitle tag="h5">User Profile</CardTitle>
              <CardText>
                View per-user statistics, difficulty progression, and the most
                frequently solved tags.
              </CardText>
              {/* Removed the <Link> wrapper and applied the click handler */}
              <Button
                color="primary"
                outline
                size="sm"
                onClick={handleGetStarted}
              >
                Get Started
              </Button>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;
