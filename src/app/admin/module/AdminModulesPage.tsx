"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminModulesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminId = searchParams.get("admin_id");

  const [modules, setModules] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newModule, setNewModule] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  /* ✅ Load admin info */
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedType = localStorage.getItem("userType");

    if (!savedUser || savedType !== "admin") {
      router.push("/");
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [router]);

  /* ✅ Fetch modules */
  const fetchModules = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/admin/modules/list");
      const data = await res.json();
      if (data.success) {
        setModules(data.modules);
      }
    } catch (error) {
      console.error("❌ Error fetching modules:", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  /* ✅ Create new module */
  const handleCreateModule = async () => {
    if (!newModule.name.trim()) {
      Swal.fire("Missing Name", "Please enter a module name.", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/modules/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newModule.name.trim(),
          description: newModule.description.trim(),
          created_by: adminId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        Swal.fire({
          title: "✅ Module Created!",
          text: `"${newModule.name}" has been added successfully.`,
          icon: "success",
          confirmButtonColor: "#548E28",
          timer: 1200,
          showConfirmButton: false,
        });
        setShowModal(false);
        setNewModule({ name: "", description: "" });
        fetchModules();
      } else {
        Swal.fire("Error", data.error || "Failed to create module.", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Server error occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ✏️ Update module info */
  const handleEditModule = (module: any) => {
    Swal.fire({
      title: "Edit Module",
      html: `
        <input id="modName" class="swal2-input" placeholder="Module Name" value="${module.name}" />
        <textarea id="modDesc" class="swal2-textarea" placeholder="Description">${module.description || ""}</textarea>
      `,
      confirmButtonText: "Save Changes",
      confirmButtonColor: "#548E28",
      showCancelButton: true,
      cancelButtonColor: "#aaa",
      preConfirm: () => {
        const name = (document.getElementById("modName") as HTMLInputElement).value.trim();
        const description = (document.getElementById("modDesc") as HTMLTextAreaElement).value.trim();
        if (!name) {
          Swal.showValidationMessage("Module name is required!");
          return;
        }
        return { name, description };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch("/api/admin/modules/update2", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: module.id,
              name: result.value!.name,
              description: result.value!.description,
            }),
          });

          const data = await res.json();
          if (data.success) {
            Swal.fire("Updated!", "Module details have been updated.", "success");
            fetchModules();
          } else {
            Swal.fire("Error", data.error || "Failed to update module.", "error");
          }
        } catch (err) {
          Swal.fire("Error", "Server error while updating.", "error");
        }
      }
    });
  };

  /* 🗑️ Delete module */
  const handleDeleteModule = (id: number, name: string) => {
    Swal.fire({
      title: `Delete "${name}"?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#548E28",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete",
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const response = await fetch("/api/admin/modules/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
          const data = await response.json();

          if (data.success) {
            Swal.fire("Deleted!", `${name} has been removed.`, "success");
            fetchModules();
          } else {
            Swal.fire("Error", data.error || "Failed to delete module.", "error");
          }
        } catch (err) {
          Swal.fire("Error", "Server error while deleting module.", "error");
        }
      }
    });
  };

  /* ✅ Open module creator */
  const handleOpenModule = (id: string) => {
    router.push(`/admin/module/creator?module_id=${id}&admin_id=${adminId}`);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Loading admin data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* ✅ Header */}
      <header className="w-full bg-[#548E28] text-white flex items-center justify-between px-5 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/admin?admin_id=${adminId}`)}
            className="text-white text-2xl font-bold hover:opacity-80 transition"
          >
            ←
          </button>
          <Image
            src={user.avatar || "/resources/icons/admin.png"}
            alt="Admin Avatar"
            width={45}
            height={45}
            className="rounded-full border-2 border-white"
          />
          <div>
            <h1 className="font-semibold text-lg">Modules</h1>
            <p className="text-xs opacity-80">
              Manage and organize your learning materials
            </p>
          </div>
        </div>
      </header>

      {/* ✅ Module List */}
      <main className="w-full max-w-md flex-1 p-6">
        <h2 className="text-[#548E28] font-bold text-lg mb-3">
          Available Modules
        </h2>

        <div className="border-2 border-[#548E28] rounded-lg bg-[#f3f8f2] p-4 shadow-inner min-h-[300px] max-h-[450px] overflow-y-auto">
          {fetching ? (
            <p className="text-gray-700 text-center mt-8 font-medium">
              Loading modules...
            </p>
          ) : modules.length > 0 ? (
            <div className="space-y-3">
              {modules.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-white border border-[#548E28]/40 rounded-md p-3 flex items-center justify-between hover:bg-[#f3f8f2] transition"
                >
                  <div
                    onClick={() => handleOpenModule(mod.id)}
                    className="flex-1 cursor-pointer"
                  >
                    <h3 className="font-semibold text-[#548E28] text-base truncate">
                      {mod.name}
                    </h3>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                      {mod.description || "No description provided."}
                    </p>
                    <span className="text-xs text-gray-500 mt-1">
                      Created:{" "}
                      {mod.created_at
                        ? new Date(mod.created_at).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 ml-3">
                    <Pencil
                      className="w-5 h-5 text-blue-600 cursor-pointer hover:text-blue-800"
                      onClick={() => handleEditModule(mod)}
                    />
                    <Trash2
                      className="w-5 h-5 text-red-600 cursor-pointer hover:text-red-800"
                      onClick={() => handleDeleteModule(mod.id, mod.name)}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-700 text-center mt-8 font-medium">
              No modules yet. Create one using the "+" button below.
            </p>
          )}
        </div>
      </main>

      {/* ✅ Floating Add Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 bg-[#548E28] hover:bg-[#3d6c1f] text-white rounded-full p-4 shadow-lg transition-all"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ✅ Create Module Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white w-[90%] max-w-sm p-6 rounded-lg shadow-lg relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-[#548E28] font-bold text-lg mb-4 text-center">
              Create New Module
            </h2>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Module Name
            </label>
            <input
              type="text"
              value={newModule.name}
              onChange={(e) =>
                setNewModule((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter module name"
              className="w-full border-2 border-[#548E28] rounded-md p-2 text-sm mb-4 text-gray-700"
            />

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Short Description
            </label>
            <textarea
              value={newModule.description}
              onChange={(e) =>
                setNewModule((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter a short description..."
              className="w-full border-2 border-[#548E28] rounded-md p-2 text-sm text-gray-700 mb-4 resize-none h-24"
            />

            <button
              onClick={handleCreateModule}
              disabled={loading}
              className="w-full bg-[#548E28] text-white font-semibold py-2 rounded-md hover:bg-[#3d6c1f] disabled:opacity-70"
            >
              {loading ? "Saving..." : "Save Module"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
