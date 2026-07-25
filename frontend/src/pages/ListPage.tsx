import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Container,
  Spinner,
  Alert,
  Input,
  Label,
  Row,
  Col,
  Button,
  Badge,
} from "reactstrap";
import { api, type ProblemsParams } from "../lib/api";
import type { Problem, TagCount, DifficultyResponse } from "../types/api";
import { useDebounce } from "../hooks/useDebounce";
import { getDifficultyColor, getDifficultyLabel } from "../lib/difficulty";
import { useUser } from "../context/UserContext";

type SortKey = "id_asc" | "id_desc" | "diff_asc" | "diff_desc";

export default function ListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { solvedSet, username } = useUser();
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialTags = searchParams.get("tags") || "";
  const initialSearch = searchParams.get("q") || "";
  const initialSort = (searchParams.get("sort") as SortKey) || "id_asc";

  const [problems, setProblems] = useState<Problem[]>([]);
  const [tags, setTags] = useState<TagCount[]>([]);
  const [difficulties, setDifficulties] = useState<Map<string, number>>(
    new Map(),
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialTags ? initialTags.split(",").map((t) => t.trim()) : [],
  );
  const [page, setPage] = useState<number>(initialPage);
  const [searchInput, setSearchInput] = useState<string>(initialSearch);
  const [sortKey, setSortKey] = useState<SortKey>(initialSort);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tag search states
  const [tagSearchInput, setTagSearchInput] = useState<string>("");
  const [showTagDropdown, setShowTagDropdown] = useState<boolean>(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchInput, 300);
  const limit = 50;

  useEffect(() => {
    api
      .tags()
      .then((res) => setTags(res || []))
      .catch((err) => console.error(err));

    api
      .difficulties()
      .then((res: DifficultyResponse) => {
        const map = new Map<string, number>();
        if (res) {
          Object.entries(res).forEach(([problemId, model]) => {
            if (model && model.difficulty !== undefined) {
              map.set(problemId, model.difficulty);
            }
          });
        }
        setDifficulties(map);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params: ProblemsParams = {
      page,
      limit,
      search: debouncedSearch.trim().toLowerCase(),
      sort: sortKey,
    };

    // Send multiple tags as comma-separated string
    if (selectedTags.length > 0) {
      params.tags = selectedTags.join(",");
    }

    api
      .problems(params)
      .then((res) => {
        setProblems(res.items || []);
        setTotalPages(res.totalPages || 1);
        setTotal(res.total || 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, selectedTags, debouncedSearch, sortKey]);

  useEffect(() => {
    const next: Record<string, string> = {};
    if (page > 1) next.page = String(page);
    if (selectedTags.length > 0) next.tags = selectedTags.join(",");
    if (debouncedSearch) next.q = debouncedSearch;
    if (sortKey !== "id_asc") next.sort = sortKey;
    setSearchParams(next, { replace: true });
  }, [page, selectedTags, debouncedSearch, sortKey, setSearchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTagDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter tags based on search input (substring matching)
  const filteredTags = useMemo(() => {
    if (!tagSearchInput.trim()) {
      return tags.filter((tag) => !selectedTags.includes(tag.Tags));
    }
    const searchLower = tagSearchInput.toLowerCase();
    return tags.filter(
      (tag) =>
        !selectedTags.includes(tag.Tags) &&
        tag.Tags.toLowerCase().includes(searchLower),
    );
  }, [tags, tagSearchInput, selectedTags]);

  const getProblemId = (link: string): string => {
    return link.split("/").pop() || "";
  };

  const visibleProblems = useMemo(() => {
    return problems.map((p) => ({
      problem: p,
      diff: difficulties.get(getProblemId(p.Problem_Link)) ?? null,
    }));
  }, [problems, difficulties]);

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagSearchInput("");
    setShowTagDropdown(false);
    setPage(1);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
    setPage(1);
  };

  const handleClearAllTags = () => {
    setSelectedTags([]);
    setPage(1);
  };

  const handleTagSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagSearchInput(e.target.value);
    setShowTagDropdown(true);
  };

  const handleTagInputFocus = () => {
    setShowTagDropdown(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSortKey(e.target.value as SortKey);
    setPage(1);
  };

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <Container className="mt-4">
      <h2 className="mb-3">Problem List</h2>

      <Row className="mb-3 g-3">
        <Col md={4}>
          <Label>
            <strong>Filter by AI Tag:</strong>
          </Label>
          <div ref={tagDropdownRef} className="position-relative">
            <Input
              type="text"
              placeholder="Search and add tags..."
              value={tagSearchInput}
              onChange={handleTagSearchChange}
              onFocus={handleTagInputFocus}
            />
            {showTagDropdown && (
              <div
                className="position-absolute w-100 mt-1"
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  zIndex: 1000,
                  backgroundColor: "var(--app-bg)",
                  border: "1px solid var(--table-border)",
                  borderRadius: "4px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                {filteredTags.length === 0 ? (
                  <div className="p-2" style={{ color: "var(--text-muted)" }}>
                    {tagSearchInput
                      ? "No tags found"
                      : "All tags already added"}
                  </div>
                ) : (
                  filteredTags.map((tag) => (
                    <div
                      key={tag.Tags}
                      className="p-2"
                      style={{
                        cursor: "pointer",
                        borderBottom: "1px solid var(--table-border)",
                      }}
                      onClick={() => handleAddTag(tag.Tags)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--table-row-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {tag.Tags}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Tags Badges */}
          {selectedTags.length > 0 && (
            <div className="mt-2 d-flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  color="primary"
                  className="d-inline-flex align-items-center gap-1"
                  style={{
                    fontSize: "0.85em",
                    padding: "0.4em 0.6em",
                    cursor: "pointer",
                  }}
                >
                  {tag}
                  <span
                    onClick={() => handleRemoveTag(tag)}
                    style={{
                      cursor: "pointer",
                      marginLeft: "4px",
                      fontWeight: "bold",
                      opacity: 0.7,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.opacity = "0.7")
                    }
                  >
                    ×
                  </span>
                </Badge>
              ))}
              <Button
                color="link"
                size="sm"
                onClick={handleClearAllTags}
                className="p-0"
                style={{ fontSize: "0.85em" }}
              >
                Clear all
              </Button>
            </div>
          )}
        </Col>

        <Col md={4}>
          <Label htmlFor="searchInput">
            <strong>Search Problem ID:</strong>
          </Label>
          <Input
            id="searchInput"
            type="text"
            placeholder="e.g. abc300_a"
            value={searchInput}
            onChange={handleSearchChange}
          />
        </Col>

        <Col md={4}>
          <Label htmlFor="sortSelect">
            <strong>Sort by:</strong>
          </Label>
          <Input
            id="sortSelect"
            type="select"
            value={sortKey}
            onChange={handleSortChange}
          >
            <option value="id_asc">Default (ID A to Z)</option>
            <option value="id_desc">ID (Z to A)</option>
            <option value="diff_asc">Difficulty (Easy to Hard)</option>
            <option value="diff_desc">Difficulty (Hard to Easy)</option>
          </Input>
        </Col>
      </Row>

      {loading && (
        <div className="text-center my-4">
          <Spinner color="primary" /> <span className="ms-2">Loading...</span>
        </div>
      )}

      {error && <Alert color="danger">{error}</Alert>}

      {!loading && !error && visibleProblems.length === 0 && (
        <Alert
          color="warning"
          style={{
            backgroundColor: "#3d3420",
            borderColor: "#5e4e2a",
            color: "#eec97a",
          }}
        >
          No problems found for current filters.
        </Alert>
      )}

      {!loading && !error && visibleProblems.length > 0 && (
        <>
          <div className="custom-table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Problem Link</th>
                  <th>Difficulty</th>
                  <th>AI Tags</th>
                  <th>Editorial</th>
                </tr>
              </thead>
              <tbody>
                {visibleProblems.map(({ problem: p, diff }, idx) => {
                  const pid = getProblemId(p.Problem_Link);
                  const isSolved = solvedSet.has(pid);
                  return (
                    <tr
                      key={p.Problem_Link}
                      className={isSolved ? "solved-row" : ""}
                      title={isSolved ? `Solved by ${username}` : undefined}
                    >
                      <td>{(page - 1) * limit + idx + 1}</td>
                      <td>
                        <a
                          href={p.Problem_Link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {pid || "View Problem"}
                        </a>
                        {isSolved && (
                          <Badge color="success" className="ms-2">
                            AC
                          </Badge>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            color: getDifficultyColor(diff),
                            fontWeight: 600,
                          }}
                        >
                          {getDifficultyLabel(diff)}
                        </span>
                      </td>
                      <td>
                        {p.Tags ? (
                          p.Tags.split(",").map((tag) => (
                            <Badge key={tag} color="info" className="me-1">
                              {tag.trim()}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {p.Editorial_Link ? (
                          <a
                            href={p.Editorial_Link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center my-3">
            <Button color="secondary" onClick={goPrev} disabled={page === 1}>
              Previous
            </Button>
            <span>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>{" "}
              <small className="text-muted">({total} total)</small>
            </span>
            <Button
              color="secondary"
              onClick={goNext}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </Container>
  );
}
