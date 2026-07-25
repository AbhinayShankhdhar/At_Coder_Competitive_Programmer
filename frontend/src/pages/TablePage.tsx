import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Container,
  Spinner,
  Alert,
  Button,
  ButtonGroup,
  Row,
  Col,
  FormGroup,
  Label,
  Input,
  Badge,
} from "reactstrap";
import { api } from "../lib/api";
import type {
  Contest,
  AllProblem,
  DifficultyResponse,
  TagCount,
} from "../types/api";
import DifficultyCircle from "../components/DifficultyCircle";
import { getDifficultyInfo } from "../lib/difficulty";
import { useUser } from "../context/UserContext";

type Category =
  | "ABC"
  | "ARC"
  | "AGC"
  | "AHC"
  | "JOI"
  | "PAST"
  | "Marathon"
  | "Other";

const CATEGORIES: Category[] = [
  "ABC",
  "ARC",
  "AGC",
  "AHC",
  "JOI",
  "PAST",
  "Marathon",
  "Other",
];

const CATEGORY_TITLES: Record<Category, string> = {
  ABC: "AtCoder Beginner Contest",
  ARC: "AtCoder Regular Contest",
  AGC: "AtCoder Grand Contest",
  AHC: "AtCoder Heuristic Contest",
  JOI: "Japanese Olympiad in Informatics",
  PAST: "PAST (Algorithmic Skill Test)",
  Marathon: "Marathon and Long Contests",
  Other: "Other Contests",
};

const ABC_HEADERS = ["A", "B", "C", "D", "E", "F", "G", "H/Ex"];
const ARC_HEADERS = ["A", "B", "C", "D", "E", "F"];
const AGC_HEADERS = ["A", "B", "C", "D", "E", "F"];
const AHC_HEADERS = ["A"];
const GENERIC_HEADERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function getHeaderList(category: Category): string[] {
  if (category === "ABC") return ABC_HEADERS;
  if (category === "ARC") return ARC_HEADERS;
  if (category === "AGC") return AGC_HEADERS;
  if (category === "AHC") return AHC_HEADERS;
  return GENERIC_HEADERS;
}

function normalizeIndex(problemIndex: string, category: Category): string {
  if (category === "ABC" && (problemIndex === "H" || problemIndex === "Ex")) {
    return "H/Ex";
  }
  return problemIndex;
}

function isContestInCategory(contestId: string, category: Category): boolean {
  const id = contestId.toLowerCase();
  switch (category) {
    case "ABC":
      return /^abc\d+$/.test(id);
    case "ARC":
      return /^arc\d+$/.test(id);
    case "AGC":
      return /^agc\d+$/.test(id);
    case "AHC":
      return /^ahc\d+$/.test(id);
    case "JOI":
      return id.startsWith("joi") || id.startsWith("joig");
    case "PAST":
      return id.startsWith("past");
    case "Marathon":
      return (
        id.includes("masters") ||
        id.includes("marathon") ||
        id.includes("hokudai-hitachi") ||
        id.includes("genocon") ||
        id.includes("future-contest")
      );
    case "Other":
      return (
        !/^(abc|arc|agc|ahc)\d+$/.test(id) &&
        !id.startsWith("joi") &&
        !id.startsWith("past") &&
        !id.includes("masters") &&
        !id.includes("marathon") &&
        !id.includes("hokudai-hitachi") &&
        !id.includes("genocon") &&
        !id.includes("future-contest")
      );
    default:
      return false;
  }
}

function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function TablePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { solvedSet, username } = useUser();
  const initialCategory =
    (searchParams.get("category") as Category) &&
    CATEGORIES.includes(searchParams.get("category") as Category)
      ? (searchParams.get("category") as Category)
      : "ABC";
  const [activeCategory, setActiveCategory] =
    useState<Category>(initialCategory);
  const [showDifficulty, setShowDifficulty] = useState<boolean>(
    searchParams.get("diff") !== "0",
  );
  const [showTags, setShowTags] = useState<boolean>(
    searchParams.get("tags") !== "0",
  );
  const [hideEmpty, setHideEmpty] = useState<boolean>(
    searchParams.get("empty") === "0",
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    (searchParams.get("filterTags") || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  );
  const [tags, setTags] = useState<TagCount[]>([]);
  const [tagSearchInput, setTagSearchInput] = useState<string>("");
  const [showTagDropdown, setShowTagDropdown] = useState<boolean>(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [allProblems, setAllProblems] = useState<AllProblem[]>([]);
  const [difficulties, setDifficulties] = useState<DifficultyResponse>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.allProblems(),
      api.difficulties(),
      api.contests(),
      api.tags(),
    ])
      .then(([probsRes, diffRes, contestsRes, tagsRes]) => {
        setAllProblems(probsRes.items || []);
        setDifficulties(diffRes || {});
        setContests(contestsRes.items || []);
        setTags(tagsRes || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const next: Record<string, string> = {};
    if (activeCategory !== "ABC") next.category = activeCategory;
    if (!showDifficulty) next.diff = "0";
    if (!showTags) next.tags = "0";
    if (hideEmpty) next.empty = "0";
    if (selectedTags.length > 0) next.filterTags = selectedTags.join(",");
    setSearchParams(next, { replace: true });
  }, [
    activeCategory,
    showDifficulty,
    showTags,
    hideEmpty,
    selectedTags,
    setSearchParams,
  ]);

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

  const filteredTags = useMemo(() => {
    const searchLower = tagSearchInput.trim().toLowerCase();
    return tags.filter(
      (tag) =>
        !selectedTags.includes(tag.Tags) &&
        (!searchLower || tag.Tags.toLowerCase().includes(searchLower)),
    );
  }, [tags, tagSearchInput, selectedTags]);

  const filteredProblemsByContest = useMemo(() => {
    const map = new Map<string, AllProblem[]>();
    for (const p of allProblems) {
      const problemTags = parseTags(p.tags).map((tag) => tag.toLowerCase());
      const matchesAllTags = selectedTags.every((tag) =>
        problemTags.includes(tag.toLowerCase()),
      );
      if (!matchesAllTags) continue;
      if (!map.has(p.contest_id)) map.set(p.contest_id, []);
      map.get(p.contest_id)!.push(p);
    }
    return map;
  }, [allProblems, selectedTags]);

  const filteredContests = useMemo(() => {
    return contests
      .filter((c) => isContestInCategory(c.id, activeCategory))
      .filter((c) => {
        if (!hideEmpty) return true;
        return (filteredProblemsByContest.get(c.id) || []).length > 0;
      })
      .sort((a, b) => b.start_epoch_second - a.start_epoch_second);
  }, [contests, activeCategory, hideEmpty, filteredProblemsByContest]);

  const headerList = useMemo(
    () => getHeaderList(activeCategory),
    [activeCategory],
  );

  const formatDate = (epoch: number) => {
    const d = new Date(epoch * 1000);
    return d.toISOString().slice(0, 10);
  };

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagSearchInput("");
    setShowTagDropdown(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <Container fluid className="mt-3 mb-5 px-3 px-md-4">
      <Row className="mb-3 align-items-center">
        <Col xs="12">
          <h3 className="mb-2">Contest Table</h3>
          <p className="text-muted small mb-3">
            Browse all AtCoder problems organized by contest. Each cell is
            colored by difficulty and tagged with AI-detected categories.
          </p>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col xs="12">
          <ButtonGroup className="flex-wrap">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                color={activeCategory === cat ? "primary" : "secondary"}
                outline={activeCategory !== cat}
                size="sm"
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </ButtonGroup>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col xs="12" className="d-flex flex-wrap gap-3">
          <FormGroup check inline className="mb-0">
            <Label check>
              <Input
                type="checkbox"
                checked={showDifficulty}
                onChange={(e) => setShowDifficulty(e.target.checked)}
              />{" "}
              Show Difficulty
            </Label>
          </FormGroup>

          <FormGroup check inline className="mb-0">
            <Label check>
              <Input
                type="checkbox"
                checked={showTags}
                onChange={(e) => setShowTags(e.target.checked)}
              />{" "}
              Show Tags
            </Label>
          </FormGroup>

          <FormGroup check inline className="mb-0">
            <Label check>
              <Input
                type="checkbox"
                checked={hideEmpty}
                onChange={(e) => setHideEmpty(e.target.checked)}
              />{" "}
              Hide Empty Contests
            </Label>
          </FormGroup>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md="6" lg="4">
          <Label htmlFor="tableTagFilter">
            <strong>Filter by AI Tag:</strong>
          </Label>
          <div ref={tagDropdownRef} className="position-relative">
            <Input
              id="tableTagFilter"
              type="text"
              placeholder="Search and add tags..."
              value={tagSearchInput}
              onChange={(e) => {
                setTagSearchInput(e.target.value);
                setShowTagDropdown(true);
              }}
              onFocus={() => setShowTagDropdown(true)}
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
          {selectedTags.length > 0 && (
            <div className="mt-2 d-flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  color="primary"
                  className="d-inline-flex align-items-center gap-1"
                  style={{ fontSize: "0.85em", padding: "0.4em 0.6em" }}
                >
                  {tag}
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    aria-label={`Remove ${tag} filter`}
                    onClick={() => handleRemoveTag(tag)}
                    style={{ fontSize: "0.55em" }}
                  />
                </Badge>
              ))}
              <Button
                color="link"
                size="sm"
                onClick={() => setSelectedTags([])}
                className="p-0"
                style={{ fontSize: "0.85em" }}
              >
                Clear all
              </Button>
            </div>
          )}
          {selectedTags.length > 1 && (
            <small className="text-muted d-block mt-2">
              Showing problems that match all selected tags.
            </small>
          )}
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <h4 className="mb-1">{CATEGORY_TITLES[activeCategory]}</h4>
          <small className="text-muted">
            {filteredContests.length} contests
          </small>
        </Col>
      </Row>

      {loading && (
        <div className="text-center my-5">
          <Spinner color="primary" />
          <span className="ms-2">Loading problems...</span>
        </div>
      )}

      {error && <Alert color="danger">{error}</Alert>}

      {!loading && !error && filteredContests.length === 0 && (
        <Alert color="warning">No contests in this category.</Alert>
      )}

      {!loading && !error && filteredContests.length > 0 && (
        <div className="custom-table-wrapper">
          <table className="custom-contest-table">
            <colgroup>
              <col className="contest-column" />
              {headerList.map((h) => (
                <col key={h} className="problem-column" />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th>Contest</th>
                {headerList.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredContests.map((c) => {
                const probs = filteredProblemsByContest.get(c.id) || [];
                const byHeader = new Map<string, AllProblem>();
                for (const p of probs) {
                  const h = normalizeIndex(p.problem_index, activeCategory);
                  if (!byHeader.has(h)) byHeader.set(h, p);
                }
                return (
                  <tr key={c.id}>
                    <td className="contest-cell">
                      <a
                        href={`https://atcoder.jp/contests/${c.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-decoration-none fw-semibold d-block"
                        title={`${c.id.toUpperCase()} - ${formatDate(c.start_epoch_second)}`}
                      >
                        {c.id.toUpperCase()}
                      </a>
                      <small
                        className="text-muted"
                        style={{ fontSize: "0.7em" }}
                      >
                        {formatDate(c.start_epoch_second)}
                      </small>
                    </td>
                    {headerList.map((h) => {
                      const p = byHeader.get(h);
                      if (!p) {
                        return (
                          <td
                            key={h}
                            className="text-center text-muted empty-cell"
                          >
                            <small>-</small>
                          </td>
                        );
                      }
                      const diff = difficulties[p.id]?.difficulty ?? null;
                      const isExp = difficulties[p.id]?.is_experimental;
                      const info = getDifficultyInfo(diff);
                      const tags = parseTags(p.tags);
                      const isSolved = solvedSet.has(p.id);
                      return (
                        <td
                          key={h}
                          className={isSolved ? "solved-cell" : ""}
                          title={isSolved ? `Solved by ${username}` : undefined}
                        >
                          <a
                            href={`https://atcoder.jp/contests/${p.contest_id}/tasks/${p.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`${p.name}${diff != null ? ` (Difficulty: ${Math.round(diff)})` : " "}${tags.length ? `\nTags: ${tags.join(", ")}` : " "}`}
                            className="text-decoration-none d-flex align-items-center gap-1"
                            style={{
                              color: info.color,
                              fontWeight: 600,
                              minWidth: 0,
                            }}
                          >
                            <DifficultyCircle
                              difficulty={diff}
                              isExperimental={isExp}
                            />
                            <span
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                flex: 1,
                                minWidth: 0,
                                fontSize: "0.8em",
                              }}
                            >
                              {h}. {p.name}
                            </span>
                            {showDifficulty && diff != null && (
                              <span
                                style={{
                                  color: info.color,
                                  fontSize: "0.75em",
                                  opacity: 0.8,
                                  flexShrink: 0,
                                }}
                              >
                                {Math.round(diff)}
                              </span>
                            )}
                          </a>
                          {showTags && (
                            <div className="problem-tags mt-1">
                              {tags.length > 0 ? (
                                tags.map((t) => (
                                  <Badge
                                    key={t}
                                    color="light"
                                    className="problem-tag text-dark border"
                                  >
                                    {t}
                                  </Badge>
                                ))
                              ) : (
                                <small className="problem-tags-empty">
                                  No AI tags available
                                </small>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
