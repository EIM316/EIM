"use client";

import { useEffect, useRef, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LogOut,
  Menu,
  Plus,
  Save,
  Trash2,
  Settings,
  Music,
  X,
  Check,
  ArrowLeft,
} from "lucide-react";
import Swal from "sweetalert2";

/* ---------- types ---------- */
type OptionItem = { id: number; name: string; image: string; filename?: string };
type Rect = { id: number; x: number; y: number; w: number; h: number; color: string };
type SetItem = { id: number; name: string; created: string };

/* ---------- component ---------- */
export default function GameMode3Page() {
  const router = useRouter();

  // auth
  const [user, setUser] = useState<any>(null);

  // sets (front-end only)
  const [sets, setSets] = useState<SetItem[]>([]);

  // builder modal
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [editingSet, setEditingSet] = useState<SetItem | null>(null);

  // music
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);

  // schematic builder states (fresh each open)
  const imageRef = useRef<HTMLDivElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string | null>(null);
  const [setName, setSetName] = useState<string>("");

  // option bank & correct answers
  const [optionBank, setOptionBank] = useState<OptionItem[]>([]);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [optionModalMode, setOptionModalMode] = useState<"add" | "choose">("add");
  const [editingOptionSlot, setEditingOptionSlot] = useState<number | null>(null);
  const [modalOptionName, setModalOptionName] = useState("");
  const [modalOptionFile, setModalOptionFile] = useState<File | null>(null);

  const [correctAnswers, setCorrectAnswers] = useState<(OptionItem | null)[]>(
    [null, null, null, null, null]
  );

  // rectangles & mobile tap
  const colors = ["#FF3B3B", "#FFA500", "#00BFFF", "#32CD32", "#800080"];
  const [rects, setRects] = useState<Rect[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);

  // force mobile for testing convenience
  const [isMobile] = useState(true);
  const [showOptionBankModal, setShowOptionBankModal] = useState(false);


  /* ---------- auth load ---------- */
useEffect(() => {
  const savedUser = localStorage.getItem("user");
  const savedType = localStorage.getItem("userType");

  if (!savedUser || savedType !== "admin") {
    router.push("/");
    return;
  }

  const parsed = JSON.parse(savedUser);
  setUser(parsed);

  // ✅ Fetch sets and options
  (async () => {
    try {
      const [setsRes, optRes] = await Promise.all([
        fetch(`/api/gamemode3/set/list?admin_id=${parsed.admin_id}`),
        fetch(`/api/gamemode3/option/list?admin_id=${parsed.admin_id}`)
      ]);

      const setsData = await setsRes.json();
      const optionsData = await optRes.json();

      setSets(
  setsData.map((s: any) => ({
    id: s.id,
    name: s.set_name,
    created: new Date(s.created_at).toLocaleDateString()
  }))
);

setOptionBank(
  optionsData.map((o: any) => ({
    id: o.id,
    name: o.option_name,
    image: o.image_url
  }))
);

    } catch (err) {
      console.error("Error loading GameMode3 data:", err);
    }
  })();
}, [router]);


  /* ---------- music: load current theme ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/gamemode1/music/get");
        if (!res.ok) return;
        const data = await res.json();
        setSelectedTheme(data.theme_file ?? null);
      } catch (err) {
        console.error("music get error", err);
      }
    })();
  }, []);

  /* ---------- helper: file -> objectURL ---------- */
  const fileToUrl = (f: File) => ({ url: URL.createObjectURL(f), name: f.name });

  /* ---------- music preview ---------- */
  const handlePreview = (file: string) => {
    try {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
        previewAudioRef.current = null;
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      if (currentlyPlaying === file) {
        setCurrentlyPlaying(null);
        return;
      }
      const audio = new Audio(file);
      audio.volume = 0.5;
      audio.play().catch(() => {});
      previewAudioRef.current = audio;
      setCurrentlyPlaying(file);
      previewTimeoutRef.current = window.setTimeout(() => {
        if (previewAudioRef.current) {
          previewAudioRef.current.pause();
          previewAudioRef.current.currentTime = 0;
          previewAudioRef.current = null;
        }
        previewTimeoutRef.current = null;
        setCurrentlyPlaying(null);
      }, 15000);
      audio.onended = () => {
        if (previewTimeoutRef.current) {
          clearTimeout(previewTimeoutRef.current);
          previewTimeoutRef.current = null;
        }
        previewAudioRef.current = null;
        setCurrentlyPlaying(null);
      };
    } catch (err) {
      console.error("audio preview error", err);
    }
  };

  const handleSaveTheme = async () => {
    if (!selectedTheme) return;
    try {
      await fetch("/api/gamemode3/music/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: user.admin_id,
          gamemode: "gamemode3",
          theme_name: selectedTheme.split("/").pop()?.replace(".mp3", ""),
          theme_file: selectedTheme,
        }),
      });
      // subtle toast
      Swal.fire({
        icon: "success",
        toast: true,
        title: "Theme saved",
        position: "top-end",
        showConfirmButton: false,
        timer: 1200,
      });
      setShowMusicModal(false);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to save theme", "error");
    }
  };

  /* ---------- open fresh builder (new set) ---------- */
  const handleAddSet = () => {
    setEditingSet(null);
    resetBuilderState();
    setShowBuilderModal(true);
  };

/* ---------- open builder for edit (loads saved image, rects & answers) ---------- */
const handleEditSet = async (s: SetItem) => {
  try {
    setEditingSet(s);
    resetBuilderState();
    setSetName(s.name);
    setShowBuilderModal(true);

    // ✅ Fetch full set details
    const res = await fetch(`/api/gamemode3/set/get?id=${s.id}`);
    if (!res.ok) throw new Error("Failed to load set data");
    const data = await res.json();

    // ✅ Load image
    if (data.image_url) {
      setPreview(data.image_url);
      setPreviewFilename(data.image_url.split("/").pop());
    }

    // ✅ Load rectangles
    let rectArray = [];
    try {
      if (Array.isArray(data.rect_data)) {
        rectArray = data.rect_data;
      } else {
        rectArray = JSON.parse(data.rect_data || "[]");
      }
    } catch {
      rectArray = [];
    }
    setRects(rectArray);

    // ✅ Load correct answers
    let answersArray = [];
    try {
      if (Array.isArray(data.correct_answers)) {
        answersArray = data.correct_answers;
      } else {
        answersArray = JSON.parse(data.correct_answers || "[]");
      }
    } catch {
      answersArray = [];
    }

    setCorrectAnswers(
      Array.from({ length: 5 }).map((_, i) =>
        answersArray[i] && answersArray[i].id
          ? {
              id: answersArray[i].id,
              name: answersArray[i].name,
              image: answersArray[i].image,
            }
          : null
      )
    );

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "info",
      title: "Set loaded successfully",
      showConfirmButton: false,
      timer: 1200,
    });
  } catch (err) {
    console.error("Error loading set data:", err);
    Swal.fire("Error", "Failed to load set details", "error");
  }
};



  const resetBuilderState = () => {
    setPreview(null);
    setPreviewFilename(null);
    setSetName("");
    setCorrectAnswers([null, null, null, null, null]);
    setRects([]);
    setSelectedBoxId(null);
  };

  /* ---------- save set => close modal and append / update list (no success alert) ---------- */
  const handleSaveSet = async () => {
  if (!setName.trim()) {
    Swal.fire("Set name is required", "", "warning");
    return;
  }

  try {
    const payload = {
      admin_id: user.admin_id,
      set_name: setName,
      image_url: preview,
      rect_data: rects,
      correct_answers: correctAnswers,
    };

    if (editingSet) {
      // UPDATE
      await fetch("/api/gamemode3/set/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingSet.id, ...payload }),
      });

      setSets((prev) =>
        prev.map((p) =>
          p.id === editingSet.id ? { ...p, name: setName } : p
        )
      );
    } else {
      // CREATE
      const res = await fetch("/api/gamemode3/set/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();

      setSets((prev) => [
        ...prev,
        {
          id: saved.id,
          name: saved.set_name,
          created: new Date(saved.created_at).toLocaleDateString(),
        },
      ]);
    }

    setShowBuilderModal(false);
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Failed to save set", "error");
  }
};


  /* ---------- upload main image ---------- */
/* ---------- upload main image ---------- */
const handleMainImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const formData = new FormData();
    formData.append("file", file);

    // ✅ Upload via /api/cloudinary/uploadg3
    const uploadRes = await fetch("/api/cloudinary/uploadg3", {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) throw new Error("Upload failed");
    const { url } = await uploadRes.json();

    setPreview(url);
    setPreviewFilename(file.name);

    Swal.fire({
      icon: "success",
      title: "Image uploaded",
      toast: true,
      position: "top-end",
      timer: 1200,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Failed to upload image", "error");
  }
};


  /* ---------- option bank modal handlers ---------- */
  const openOptionBankAdd = () => {
    setOptionModalMode("add");
    setModalOptionName("");
    setModalOptionFile(null);
    setShowOptionModal(true);
  };

const openOptionBankChoose = async (slotIndex: number) => {
  try {
    setOptionModalMode("choose");
    setEditingOptionSlot(slotIndex);

    // ✅ Fetch latest options from DB to ensure updated list
    const res = await fetch(`/api/gamemode3/option/list?admin_id=${user.admin_id}`);
    if (res.ok) {
      const data = await res.json();
      setOptionBank(
        data.map((o: any) => ({
          id: o.id,
          name: o.option_name,
          image: o.image_url,
        }))
      );
    }

    setShowOptionModal(true);
  } catch (err) {
    console.error("Error loading options:", err);
    Swal.fire("Error", "Failed to load options.", "error");
  }
};


  const handleSaveOption = async () => {
  if (!modalOptionName || !modalOptionFile) {
    Swal.fire("Name and image required", "", "warning");
    return;
  }

  try {
    // ✅ Upload image to Cloudinary via your existing endpoint
    const formData = new FormData();
    formData.append("file", modalOptionFile);
    const uploadRes = await fetch("/api/cloudinary/uploadg1", {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) throw new Error("Upload failed");
    const { url } = await uploadRes.json();

    // ✅ Save option to database
    const res = await fetch("/api/gamemode3/option/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admin_id: user.admin_id,
        option_name: modalOptionName,
        image_url: url,
      }),
    });

    if (!res.ok) throw new Error("Failed to save option");
    const saved = await res.json();

    setOptionBank((prev) => [
      ...prev,
      { id: saved.id, name: saved.option_name, image: saved.image_url },
    ]);

    setModalOptionName("");
    setModalOptionFile(null);
    setShowOptionBankModal(false);
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Failed to add option", "error");
  }
};


  const handleChooseOptionForSlot = (opt: OptionItem) => {
    if (editingOptionSlot === null) return;
    setCorrectAnswers((prev) => {
      const copy = [...prev];
      copy[editingOptionSlot] = opt;
      return copy;
    });
    setShowOptionModal(false);
  };

const handleDeleteOption = async (id: number) => {
  const confirm = await Swal.fire({
    title: "Delete this option?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#548E28",
  });
  if (!confirm.isConfirmed) return;

  try {
    const res = await fetch(`/api/gamemode3/option/delete?id=${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete");

    setOptionBank((prev) => prev.filter((o) => o.id !== id));
    setCorrectAnswers((prev) => prev.map((a) => (a?.id === id ? null : a)));
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Failed to delete option", "error");
  }
};

  /* ---------- mobile tap placement ---------- */
  const handleTapSelectBox = (id: number) => {
    if (!isMobile) return;
    setSelectedBoxId(id);
  };

 const handleTapPlaceBox = (e: React.MouseEvent<HTMLDivElement>) => {
  if (!selectedBoxId || !imageRef.current) return;

  const rect = imageRef.current.getBoundingClientRect();
  const size = 60; // fixed square size
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  // ✅ Keep square within boundaries
  const limitedX = Math.max(0, Math.min(rect.width - size, x));
  const limitedY = Math.max(0, Math.min(rect.height - size, y));

  setRects((prev) => [
    ...prev.filter((r) => r.id !== selectedBoxId),
    {
      id: selectedBoxId,
      x: limitedX,
      y: limitedY,
      w: size,
      h: size,
      color: colors[selectedBoxId - 1],
    },
  ]);

  setSelectedBoxId(null);
};


  /* ---------- cleanup audio on unmount ---------- */
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
    };
  }, []);

  /* ---------- UI ---------- */
  if (!user) {
    return <div className="flex items-center justify-center min-h-screen text-gray-700">Loading admin data...</div>;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* header */}
      <header className="w-full bg-[#548E28] text-white flex items-center justify-between px-5 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/gamemode")}
            className="flex items-center gap-1 hover:opacity-80"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <Image src={user.avatar || "/admin-avatar.png"} alt="Admin" width={45} height={45} className="rounded-full border-2 border-white" />
          <span className="font-semibold text-lg">{user.first_name}</span>
        </div>


      </header>

      {/* title */}
      <h1 className="text-2xl font-bold text-gray-800 mt-6 text-center">🎮 Game Mode 3: Schematic Builder</h1>

      {/* sets grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-4xl mt-6 px-4 pb-32">
        {sets.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 italic py-6">No sets yet. Click + to create one.</div>
        ) : (
          sets.map((s) => (
            <div key={s.id} className="bg-[#81C784] text-white rounded-2xl shadow-md p-4 flex flex-col justify-between hover:scale-105 transition" style={{ aspectRatio: "1 / 1" }}>
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold">{s.name}</h2>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEditSet(s); }}
                  className="bg-white text-[#81C784] p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm mt-2 text-center">
                Created on <br />
                <span className="text-xs opacity-80">{s.created}</span>
              </p>
            </div>
          ))
        )}
      </div>

      {/* floating buttons */}
      <button onClick={handleAddSet} className="fixed bottom-8 right-8 bg-[#548E28] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-green-700 transition" title="Add Set">
        <Plus className="w-6 h-6" />
      </button>

      <button onClick={() => setShowMusicModal(true)} className="fixed bottom-8 right-28 bg-[#548E28] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-green-700 transition" title="Select Music Theme">
        <Music className="w-6 h-6" />
      </button>

      {/* Floating Option Bank Button */}
<button
  onClick={() => setShowOptionBankModal(true)}
  className="fixed bottom-8 right-48 bg-[#548E28] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-green-700 transition"
  title="Open Option Bank"
>
  <Settings className="w-6 h-6" />
</button>

      {/* ---------- BUILDER MODAL ---------- */}
      {showBuilderModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-auto p-5 relative text-black">
            <button onClick={() => setShowBuilderModal(false)} className="absolute top-4 right-4 text-gray-600 hover:text-red-600">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold mb-4 text-[#548E28]">{editingSet ? "Edit Set" : "New Set"}</h2>

            {/* set name */}
            <div className="mb-3">
              <label className="text-sm font-semibold">Name of Set</label>
              <input value={setName} onChange={(e) => setSetName(e.target.value)} placeholder="Enter set name" className="border px-3 py-2 rounded-md w-full mt-1" />
            </div>

            {/* image + rects */}
            <div className="border border-gray-300 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <label htmlFor="mainUpload" className="text-sm font-semibold border border-gray-300 px-3 py-1 rounded bg-gray-50 cursor-pointer hover:bg-gray-100">UPLOAD</label>
                <input id="mainUpload" type="file" accept="image/*" className="hidden" onChange={handleMainImageUpload} />
                
                <div className="ml-auto text-xs text-gray-500"></div>
              </div>

             <div
  ref={imageRef}
  onClick={handleTapPlaceBox}
  className="relative border border-gray-200 w-full h-[260px] sm:h-[300px] flex items-center justify-center overflow-hidden bg-gray-50"
  style={{ touchAction: "none" }}
>
  {preview ? (
    <>
      {/* ✅ Image */}
      <img
        src={preview}
        alt="Preview"
        className="object-contain w-full h-full pointer-events-none select-none"
        draggable={false}
      />

      {/* ✅ Render Squares */}
      {rects.map((r) => (
        <div
          key={r.id}
          style={{
            position: "absolute",
            left: r.x,
            top: r.y,
            width: r.w - 20,
            height: r.h - 20,
            background: r.color,
            borderRadius: 8,
            opacity: 0.9,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          {r.id}
        </div>
      ))}
    </>
  ) : (
    <p className="text-gray-500 text-sm">UPLOAD → to add image</p>
  )}
</div>


              {/* draggable numbers (tap in mobile) */}
              <div className="flex justify-center gap-2 mt-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    onClick={() => handleTapSelectBox(n)}
                    className={`w-10 h-10 flex items-center justify-center font-bold text-white rounded-md cursor-pointer ${selectedBoxId === n ? "ring-4 ring-[#548E28]" : ""}`}
                    style={{ background: colors[n - 1] }}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>

            {/* correct answers area */}
            <h3 className="text-lg font-semibold mb-2 text-[#0E5B7A]">Correct Answers</h3>
            <div className="space-y-2 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center border rounded px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold" style={{ background: colors[i] }}>{i + 1}</div>
                    <span>{correctAnswers[i] ? correctAnswers[i]?.name : `Answer ${i + 1}`}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openOptionBankChoose(i)} className="text-xs text-[#0E5B7A] border px-2 py-1 rounded hover:bg-gray-50">{correctAnswers[i] ? "Change" : "Add"}</button>
                    {correctAnswers[i] && (
                      <button onClick={() => setCorrectAnswers((prev) => { const cp = [...prev]; cp[i] = null; return cp; })} className="text-xs text-red-600 border px-2 py-1 rounded hover:bg-gray-50">Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button onClick={handleSaveSet} className="flex items-center gap-2 bg-[#548E28] text-white px-4 py-2 rounded-md hover:bg-green-700">
                <Save className="w-4 h-4" /> Save Set
              </button>
            </div>
          </div>

          {/* Option Bank Modal (nested) */}
          {showOptionModal && (
            <div className="fixed inset-0 bg-black/40 z-60 flex items-center justify-center p-3 sm:p-6">
              <div className="bg-white rounded-lg w-full max-w-md max-h-[85vh] overflow-auto p-5 text-black">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-semibold">{optionModalMode === "choose" ? "Choose Option" : "Add Option"}</h4>
                  <button onClick={() => setShowOptionModal(false)} className="text-gray-500 text-sm">Close</button>
                </div>

                {optionModalMode === "choose" ? (
                  optionBank.length === 0 ? (
                    <div className="text-center text-gray-600 py-8">No options available. Add some first.</div>
                  ) : (
                    <div className="max-h-[60vh] overflow-y-auto grid grid-cols-2 gap-3 pr-1">
  {optionBank.map((o) => (
    <div
      key={o.id}
      onClick={() => handleChooseOptionForSlot(o)}
      className="border rounded p-2 flex items-center gap-2 cursor-pointer hover:bg-gray-100"
    >
      <img src={o.image} alt={o.name} className="w-16 h-12 object-cover rounded" />
      <div>
        <div className="font-semibold text-sm">{o.name}</div>
       
      </div>
    </div>
  ))}
</div>

                  )
                ) : (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium">Name of Option</label>
                    <input value={modalOptionName} onChange={(e) => setModalOptionName(e.target.value)} className="border px-3 py-2 rounded w-full text-sm" placeholder="Option name (required)" />
                    <label className="block text-sm font-medium">Image (required)</label>
                    <input type="file" accept="image/*" onChange={(e) => setModalOptionFile(e.target.files?.[0] || null)} className="w-full text-sm" />
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setShowOptionModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                      <button onClick={handleSaveOption} className="px-4 py-2 bg-[#548E28] text-white rounded">Save</button>
                    </div>

                    {optionBank.length > 0 && (
                      <>
                        <h5 className="text-sm font-semibold mt-4">Existing Options</h5>
                        <div className="space-y-2">
                          {optionBank.map((o) => (
                            <div key={o.id} className="flex items-center gap-2 border rounded p-2">
                              <img src={o.image} alt={o.name} className="w-14 h-10 object-cover rounded" />
                              <div className="flex-1 text-sm">
                                <p className="font-semibold">{o.name}</p>
                               
                              </div>
                              <Trash2 className="w-4 h-4 text-red-500 cursor-pointer" onClick={() => handleDeleteOption(o.id)} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- MUSIC MODAL ---------- */}
      {showMusicModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative text-black">
            <button onClick={() => setShowMusicModal(false)} className="absolute top-4 right-4 text-gray-600 hover:text-red-600">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold mb-4 text-[#548E28] text-center">🎵 Choose a Music Theme</h2>

            <ul className="space-y-3 mb-6">
              {[
                { name: "Theme 1", file: "/resources/music/theme1.mp3" },
                { name: "Theme 2", file: "/resources/music/theme2.mp3" },
                { name: "Theme 3", file: "/resources/music/theme3.mp3" },
              ].map((t) => (
                <li key={t.file} className={`border rounded-lg p-3 flex justify-between items-center cursor-pointer ${selectedTheme === t.file ? "bg-[#e8f5e9] border-[#548E28]" : "hover:bg-gray-100"}`} onClick={() => setSelectedTheme(t.file)}>
                  <div className="flex items-center gap-2">
                    {selectedTheme === t.file && <Check className="text-[#548E28] w-5 h-5" />}
                    <div>
                      <div className="font-medium text-[#548E28]">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.file.split("/").pop()}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handlePreview(t.file); }} className={`text-sm px-3 py-1 rounded ${currentlyPlaying === t.file ? "bg-red-500 text-white" : "bg-[#548E28] text-white"}`}>
                      {currentlyPlaying === t.file ? "Stop" : "Preview"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <button onClick={handleSaveTheme} className="w-full bg-[#548E28] text-white py-2 rounded-md hover:bg-green-700">Save Theme</button>
          </div>
        </div>
      )}


{/* ---------- OPTION BANK MODAL ---------- */}
{showOptionBankModal && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 sm:p-6 text-black">
    <div className="bg-white rounded-lg w-full max-w-md sm:max-w-2xl max-h-[90vh] flex flex-col p-5 relative shadow-lg">
      {/* Close Button */}
      <button
        onClick={() => setShowOptionBankModal(false)}
        className="absolute top-4 right-4 text-gray-600 hover:text-red-600"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Modal Header */}
      <h2 className="text-xl font-semibold text-[#548E28] mb-3">
        ⚙️ Option Bank
      </h2>

      {/* --- Option Form (fixed at top) --- */}
      <div className="flex-shrink-0 space-y-3 border-b pb-4">
        <label className="block text-sm font-medium">Name of Option</label>
        <input
          value={modalOptionName}
          onChange={(e) => setModalOptionName(e.target.value)}
          className="border px-3 py-2 rounded w-full text-sm"
          placeholder="Option name (required)"
        />

        <label className="block text-sm font-medium">Image (required)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setModalOptionFile(e.target.files?.[0] || null)}
          className="w-full text-sm"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowOptionBankModal(false)}
            className="px-4 py-2 border rounded text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveOption}
            className="px-4 py-2 bg-[#548E28] text-white rounded text-sm"
          >
            Save
          </button>
        </div>
      </div>

      {/* --- Scrollable List Area --- */}
      <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-2">
        {optionBank.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm italic">
            No options yet. Add one above.
          </div>
        ) : (
          optionBank.map((o) => (
            <div
              key={o.id}
              className="flex items-center gap-2 border rounded p-2 hover:bg-gray-50"
            >
              <img
                src={o.image}
                alt={o.name}
                className="w-14 h-10 object-cover rounded"
              />
              <div className="flex-1 text-sm">
                <p className="font-semibold">{o.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {o.filename}
                </p>
              </div>
              <Trash2
                className="w-4 h-4 text-red-500 cursor-pointer"
                onClick={() =>
                  setOptionBank((prev) => prev.filter((x) => x.id !== o.id))
                }
              />
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}


    </div>
  );
}
