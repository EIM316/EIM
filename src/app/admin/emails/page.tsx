"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  LayoutDashboard,
  FileText,
  Mail,
  Trash2,
  CheckCircle,
  XCircle,
  PlusCircle,
  Edit,
  Save,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

export default function AllowedDomainsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [domains, setDomains] = useState<any[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // ✅ Load admin user
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");

    if (!savedUser || savedType !== "admin") {
      router.push("/");
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [router]);

  // ✅ Fetch allowed domains
  const fetchDomains = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/emails/get");
      const data = await res.json();
      if (data.success) setDomains(data.records);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      Swal.fire("Error", "Failed to load allowed domains.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  // ✅ Add new domain
  const handleAdd = async () => {
    if (!newDomain.trim()) {
      Swal.fire("Error", "Please enter a valid domain (e.g. cvsu.edu.ph).", "error");
      return;
    }

    try {
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_type: "domain", value: newDomain }),
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire("Added!", "New allowed domain added successfully.", "success");
        setNewDomain("");
        fetchDomains();
      } else {
        Swal.fire("Error", data.message || "Something went wrong.", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Failed to add domain.", "error");
    }
  };

  // ✅ Toggle Active / Inactive
  const handleToggle = async (id: string, active: boolean) => {
    try {
      const res = await fetch("/api/admin/emails/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !active }),
      });
      const data = await res.json();
      if (data.success) fetchDomains();
      else Swal.fire("Error", "Failed to update status.", "error");
    } catch {
      Swal.fire("Error", "Toggle failed.", "error");
    }
  };

  // ✅ Delete domain
  const handleDelete = async (id: string) => {
    Swal.fire({
      title: "Delete Domain?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E57373",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete",
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const delRes = await fetch("/api/admin/emails/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
          const data = await delRes.json();

          if (data.success) {
            Swal.fire("Deleted!", "Domain removed successfully.", "success");
            fetchDomains();
          } else {
            Swal.fire("Error", "Delete failed.", "error");
          }
        } catch {
          Swal.fire("Error", "Delete failed.", "error");
        }
      }
    });
  };

  // ✅ Save edited domain
  const handleUpdateValue = async (id: string) => {
    if (!editValue.trim()) {
      Swal.fire("Error", "Domain value cannot be empty.", "error");
      return;
    }

    try {
      const res = await fetch("/api/admin/emails/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, value: editValue }),
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire("Updated!", "Domain value updated successfully.", "success");
        setEditingId(null);
        setEditValue("");
        fetchDomains();
      } else {
        Swal.fire("Error", data.message || "Failed to update domain.", "error");
      }
    } catch {
      Swal.fire("Error", "Failed to update domain.", "error");
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading admin data...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ✅ Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#2F4F24] text-white p-5 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <Image
            src={user.avatar || "/resources/icons/admin.png"}
            alt="Admin Avatar"
            width={45}
            height={45}
            className="rounded-full border-2 border-white"
          />
          <div>
            <p className="font-semibold text-sm">{user.first_name}</p>
            <p className="text-xs opacity-75">Administrator</p>
          </div>
        </div>

        <nav className="flex flex-col space-y-3">
          <button onClick={() => router.push("/admin")} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3d6530] transition">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>

          <button onClick={() => router.push("/admin/report")} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3d6530] transition">
            <FileText className="w-5 h-5" /> Reports
          </button>

          <button onClick={() => router.push("/admin/emails")} className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#548E28] transition">
            <Mail className="w-5 h-5" /> Allowed Email
          </button>
        </nav>

        <div className="mt-auto border-t border-white/20 pt-4">
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/");
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3d6530] transition"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* ✅ Mobile Sidebar */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setMenuOpen(false)}
          ></div>
          <aside
            className={`fixed top-0 left-0 w-64 h-full bg-[#2F4F24] text-white p-5 flex flex-col justify-between z-50 transform transition-transform duration-300 ${
              menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Image
                    src={user.avatar || "/resources/icons/admin.png"}
                    alt="Admin Avatar"
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-white"
                  />
                  <div>
                    <p className="font-semibold text-sm">{user.first_name}</p>
                    <p className="text-xs opacity-75">Administrator</p>
                  </div>
                </div>
                <X
                  className="w-6 h-6 cursor-pointer hover:opacity-80 transition"
                  onClick={() => setMenuOpen(false)}
                />
              </div>

              <nav className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    router.push("/admin");
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3d6530] transition"
                >
                  <LayoutDashboard className="w-5 h-5" /> Dashboard
                </button>

                <button
                  onClick={() => {
                    router.push("/admin/report");
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3d6530] transition"
                >
                  <FileText className="w-5 h-5" /> Reports
                </button>

                <button
                  onClick={() => {
                    router.push("/admin/emails");
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#548E28] transition"
                >
                  <Mail className="w-5 h-5" /> Allowed Email
                </button>
              </nav>
            </div>

            <div className="border-t border-white/20 pt-4">
              <button
                onClick={() => {
                  localStorage.clear();
                  router.push("/");
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3d6530] transition"
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ✅ Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="bg-[#548E28] text-white flex items-center justify-between px-5 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <Menu
              className="w-6 h-6 cursor-pointer md:hidden"
              onClick={() => setMenuOpen(true)}
            />
            <span className="font-semibold text-lg">Allowed Email</span>
          </div>

          <Image
            src={user.avatar || "/resources/icons/admin.png"}
            alt="Admin"
            width={40}
            height={40}
            className="rounded-full border-2 border-white"
          />
        </header>

        {/* 🔹 Add Form */}
        <section className="p-6 max-w-3xl mx-auto w-full">
          <div className="bg-white shadow-md rounded-lg p-4 mb-5">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Add New Email</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="e.g. cvsu.edu.ph"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2"
              />
              <button
                onClick={handleAdd}
                className="flex items-center justify-center gap-2 bg-[#548E28] text-white px-4 py-2 rounded-md hover:bg-[#457b22] transition"
              >
                <PlusCircle className="w-5 h-5" /> Add
              </button>
            </div>
          </div>

          {/* 🔹 Domain Table */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Allowed Emails</h2>
            {loading ? (
              <p className="text-center text-gray-500 py-5">Loading domains...</p>
            ) : (
              <table className="w-full text-sm border">
                <thead className="bg-[#548E28] text-white">
                  <tr>
                    <th className="px-3 py-2 text-left">Domain</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.length > 0 ? (
                    domains.map((item) => (
                      <tr key={item.id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2">
                          {editingId === item.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="border border-gray-300 rounded-md px-2 py-1 text-sm w-full"
                              />
                              <button
                                onClick={() => handleUpdateValue(item.id)}
                                className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditValue("");
                                }}
                                className="bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span>{item.value}</span>
                              <button
                                onClick={() => {
                                  setEditingId(item.id);
                                  setEditValue(item.value);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {item.active ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-500">
                              <XCircle className="w-4 h-4" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 flex justify-center gap-3">
                          <button
                            onClick={() => handleToggle(item.id, item.active)}
                            className={`px-3 py-1 rounded-md text-white ${
                              item.active
                                ? "bg-gray-500 hover:bg-gray-600"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {item.active ? "Disable" : "Enable"}
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-gray-500">
                        No domains found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
