import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockDelete = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    savedBike: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

// Mock NextAuth
const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

// Import handlers after mocks
import { GET, POST } from "./route";
import { DELETE, PATCH } from "./[id]/route";

const validBike = {
  name: "Cube Touring Hybrid",
  brand: "Cube",
  category: "E-Bike",
  price: 2799,
  dealer: "Fahrrad XXL",
  dealerUrl: "https://www.fahrrad-xxl.de/cube",
};

const mockSession = {
  user: { id: "user-1", email: "test@example.com", role: "USER" },
};

function jsonRequest(body: unknown, method = "POST") {
  return new Request("http://localhost/api/saved-bikes", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/saved-bikes", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns saved bikes for authenticated user", async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    const savedBikes = [{ id: "sb-1", bikeData: validBike, dealer: "Fahrrad XXL", note: null }];
    mockFindMany.mockResolvedValue(savedBikes);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.savedBikes).toHaveLength(1);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    );
  });
});

describe("POST /api/saved-bikes", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await POST(jsonRequest({ bikeData: validBike }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid bike data", async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    const res = await POST(jsonRequest({ bikeData: { name: "" } }));
    expect(res.status).toBe(400);
  });

  it("returns 409 for duplicate bike", async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    mockFindFirst.mockResolvedValue({ id: "existing" });

    const res = await POST(jsonRequest({ bikeData: validBike }));
    expect(res.status).toBe(409);
  });

  it("creates a saved bike", async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    mockFindFirst.mockResolvedValue(null);
    const created = { id: "sb-new", bikeData: validBike, dealer: "Fahrrad XXL", note: null };
    mockCreate.mockResolvedValue(created);

    const res = await POST(jsonRequest({ bikeData: validBike }));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.savedBike.id).toBe("sb-new");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1", dealer: "Fahrrad XXL" }),
      })
    );
  });
});

describe("DELETE /api/saved-bikes/[id]", () => {
  const params = Promise.resolve({ id: "sb-1" });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await DELETE(new Request("http://localhost"), { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 when bike not found", async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    mockFindUnique.mockResolvedValue(null);

    const res = await DELETE(new Request("http://localhost"), { params });
    expect(res.status).toBe(404);
  });

  it("returns 403 when bike belongs to another user", async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    mockFindUnique.mockResolvedValue({ id: "sb-1", userId: "other-user" });

    const res = await DELETE(new Request("http://localhost"), { params });
    expect(res.status).toBe(403);
  });

  it("deletes own saved bike", async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    mockFindUnique.mockResolvedValue({ id: "sb-1", userId: "user-1" });
    mockDelete.mockResolvedValue({});

    const res = await DELETE(new Request("http://localhost"), { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe("PATCH /api/saved-bikes/[id]", () => {
  const params = Promise.resolve({ id: "sb-1" });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = jsonRequest({ note: "test" }, "PATCH");
    const res = await PATCH(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 403 when bike belongs to another user", async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    mockFindUnique.mockResolvedValue({ id: "sb-1", userId: "other-user" });

    const req = jsonRequest({ note: "test" }, "PATCH");
    const res = await PATCH(req, { params });
    expect(res.status).toBe(403);
  });

  it("updates note on own saved bike", async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    mockFindUnique.mockResolvedValue({ id: "sb-1", userId: "user-1" });
    mockUpdate.mockResolvedValue({ id: "sb-1", note: "Gutes Rad!" });

    const req = jsonRequest({ note: "Gutes Rad!" }, "PATCH");
    const res = await PATCH(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.savedBike.note).toBe("Gutes Rad!");
  });

  it("allows setting note to null", async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    mockFindUnique.mockResolvedValue({ id: "sb-1", userId: "user-1" });
    mockUpdate.mockResolvedValue({ id: "sb-1", note: null });

    const req = jsonRequest({ note: null }, "PATCH");
    const res = await PATCH(req, { params });

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { note: null } })
    );
  });
});
