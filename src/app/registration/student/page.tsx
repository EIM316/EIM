"use client";

import Swal from "sweetalert2";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CloudinaryImage {
  id: string;
  url: string;
}

interface ValidationMessages {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormData {
  id_number: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function StudentRegisterPage() {
  const router = useRouter();
  const [avatar, setAvatar] = useState<string>("");
  const [icons, setIcons] = useState<CloudinaryImage[]>([]);
  const [showSelector, setShowSelector] = useState<boolean>(false);
  const [loadingIcons, setLoadingIcons] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [isValidForm, setIsValidForm] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);


  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [loadingDomains, setLoadingDomains] = useState<boolean>(true);


  const getPasswordStatus = (password: string) => {
  return {
    length: password.length >= 8,
    capital: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=;'/\\[\]`~]/.test(password),
  };
};

const [passwordStatus, setPasswordStatus] = useState({
  length: false,
  capital: false,
  number: false,
  special: false,
});


  const [validationMsg, setValidationMsg] = useState<ValidationMessages>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [formData, setFormData] = useState<FormData>({
    id_number: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // ✅ Fetch allowed domains from backend
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        setLoadingDomains(true);
        const res = await fetch("/api/admin/emails/get");
        const data = await res.json();
        if (data.success) {
          const activeDomains = data.records
            .filter((d: any) => d.active && d.entry_type === "domain")
            .map((d: any) => d.value.toLowerCase());
          setAllowedDomains(activeDomains);
        }
      } catch (err) {
        console.error("❌ Failed to load allowed domains:", err);
      } finally {
        setLoadingDomains(false);
      }
    };
    fetchDomains();
  }, []);

  // ✅ Email Validator (checks against DB domains)
  const validateEmail = (email: string): boolean => {
    if (!email.includes("@")) return false;
    const domain = "@" + email.split("@")[1]?.toLowerCase();
    return allowedDomains.includes(domain);
  };

  // ✅ Password Validator
  const validatePassword = (password: string): boolean => {
    const regex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=;'/\\[\]`~])[A-Za-z\d!@#$%^&*(),.?":{}|<>_\-+=;'/\\[\]`~]{8,}$/;
    return regex.test(password);
  };

  // ✅ Input Change Handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password") {
  setPasswordStatus(getPasswordStatus(value));
}

  };

  // ✅ Live Validation
  useEffect(() => {
    let emailMsg = "";
    let passMsg = "";
    let confirmMsg = "";

    if (formData.email && !validateEmail(formData.email)) {
      if (!loadingDomains)
        emailMsg = allowedDomains.length
          ? "Your email domain is not allowed or has been disabled."
          : "Allowed domain list not loaded yet.";
    }

    if (formData.password && !validatePassword(formData.password)) {
      passMsg =
        "Password must be at least 8 characters long, include 1 capital letter, 1 number, and 1 special character.";
    }

    if (
      formData.confirmPassword &&
      formData.confirmPassword !== formData.password
    ) {
      confirmMsg = "Passwords do not match.";
    }

    setValidationMsg({
      email: emailMsg,
      password: passMsg,
      confirmPassword: confirmMsg,
    });

    const allValid =
      formData.id_number.trim() &&
      formData.first_name.trim() &&
      formData.last_name.trim() &&
      validateEmail(formData.email) &&
      validatePassword(formData.password) &&
      formData.password === formData.confirmPassword;

    setIsValidForm(Boolean(allValid));
  }, [formData, allowedDomains, loadingDomains]);

  // ✅ Fetch Cloudinary Avatars
  useEffect(() => {
    let mounted = true;
    setLoadingIcons(true);

    fetch("/api/cloudinary/fetch")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load avatars");
        return res.json();
      })
      .then((json) => {
        if (!mounted) return;
        const imgs: CloudinaryImage[] = json.images || [];
        setIcons(imgs.map((i: any) => ({ id: i.public_id, url: i.url })));
        if (imgs.length > 0) setAvatar(imgs[0].url);
      })
      .catch((err) => {
        console.error("Error fetching Cloudinary images:", err);
      })
      .finally(() => {
        if (mounted) setLoadingIcons(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Submit Handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!isValidForm) return;

    const domain = "@" + formData.email.split("@")[1]?.toLowerCase();
    if (!allowedDomains.includes(domain)) {
      Swal.fire({
        title: "❌ Registration Blocked",
        text: "Your email domain is not allowed or has been disabled by the administrator.",
        icon: "error",
        confirmButtonColor: "#BC2A2A",
      });
      return;
    }

    setLoading(true);
    Swal.fire({
      title: "Registering...",
      text: "Please wait while we process your registration.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch("/api/student/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, avatar }),
      });

      const data = await res.json();
      Swal.close();

      if (res.ok) {
        await Swal.fire({
          title: "🎉 Registration Successful!",
          text: "Welcome to EIM!",
          icon: "success",
          confirmButtonColor: "#BC2A2A",
          confirmButtonText: "Continue",
        });
        router.push("/login");
      } else {
        await Swal.fire({
          title: "❌ Registration Failed",
          text: data.error || "Something went wrong.",
          icon: "error",
          confirmButtonColor: "#BC2A2A",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire({
        title: "⚠️ Network Error",
        text: "Please try again later.",
        icon: "warning",
        confirmButtonColor: "#BC2A2A",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4 sm:px-6 md:px-10 py-10 relative">
      {/* Navbar */}
      <div className="w-full bg-[#BC2A2A] text-white flex items-center justify-between px-6 py-4 sm:py-5 shadow-md fixed top-0 left-0 z-50">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image
            src="/resources/logo/tupc.png"
            alt="School Logo"
            width={42}
            height={42}
            className="sm:w-11 sm:h-11 rounded-full"
          />
          <h1 className="text-base sm:text-lg md:text-xl font-semibold leading-none tracking-wide">
            EIM
          </h1>
        </div>

        <button
          onClick={() => router.push("/registration")}
          className="bg-white text-[#BC2A2A] px-4 py-1.5 rounded-md font-semibold text-sm hover:bg-gray-100 transition"
        >
          Back
        </button>
      </div>

      <div className="pt-20 flex flex-col items-center w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-black">EIM</h1>
        <p className="text-gray-600 font-medium mb-8 text-center text-sm sm:text-base">
          Create an account
          <br />
          <span className="font-normal">To Start Having Fun!</span>
        </p>

        {/* Avatar */}
        <div className="mb-6 relative">
          <Image
            src={avatar || "/resources/icons/stud1.jpg"}
            alt="Student Avatar"
            width={90}
            height={90}
            className="sm:w-[100px] sm:h-[100px] rounded-full border-2 border-gray-300 object-cover"
          />
          <button
            onClick={() => setShowSelector(true)}
            className="absolute bottom-0 right-0 rounded-full bg-white border border-gray-300 shadow hover:scale-105 transition p-1"
          >
            <Image
              src="/resources/others/changeicon.png"
              alt="Change Avatar"
              width={24}
              height={24}
              className="sm:w-[28px] sm:h-[28px]"
            />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xs sm:max-w-sm flex flex-col space-y-4 text-left"
        >
          {/* Inputs */}
          {[
            { name: "id_number", label: "ID Number", type: "text" },
            { name: "first_name", label: "First Name", type: "text" },
            { name: "last_name", label: "Last Name", type: "text" },
            { name: "email", label: "Email", type: "email" },
          ].map((field) => (
            <div key={field.name} className="flex flex-col">
              <label className="text-sm sm:text-base font-semibold text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                name={field.name}
                type={field.type}
                value={(formData as any)[field.name]}
                onChange={handleChange}
                placeholder={`Enter ${field.label}`}
                className="border border-black rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#BC2A2A] text-black"
                required
              />
              {(validationMsg as any)[field.name] && (
                <p className="text-xs text-red-600 mt-1">
                  {(validationMsg as any)[field.name]}
                </p>
              )}

              {/* Allowed domains display */}
              {field.name === "email" && (
                <div className="mt-[2px] space-y-[2px] text-[11px]">
                  {loadingDomains ? (
                    <div className="flex items-center text-gray-500">
                      <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Loading allowed domains...</span>
                    </div>
                  ) : allowedDomains.length > 0 ? (
                    <>
                      <p className="text-gray-500 font-medium">
                        Allowed domains:
                      </p>
                      <div className="flex flex-wrap gap-x-2 gap-y-1 text-gray-600 ml-1">
                        {allowedDomains.map((domain, i) => (
                          <span key={i}>
                            {domain}
                            {i < allowedDomains.length - 1 && ","}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-400 italic">
                      No active domains configured.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {[
 { name: "password", label: "Password", show: showPassword, setShow: setShowPassword },

  { name: "confirmPassword", label: "Confirm Password", show: showConfirmPassword, setShow: setShowConfirmPassword }
].map((field) => (
  <div key={field.name} className="flex flex-col relative">
    <label className="text-sm sm:text-base font-semibold text-gray-700 mb-1 flex items-center">
      {field.label}

      {/* ℹ️ Info Button */}
      {field.name === "password" && (
        <button
          type="button"
          onClick={() => setShowPasswordInfo((prev) => !prev)}
          className="ml-2 text-gray-600 hover:text-black"
        >
          <Image
            src="/resources/info.jpg"
            alt="Password Info"
            width={15}
            height={15}
          />
        </button>
      )}
    </label>

    <input
      name={field.name}
      type={field.show ? "text" : "password"}
      value={(formData as any)[field.name]}
      onChange={handleChange}
      placeholder={`Enter ${field.label}`}
      className="border border-black rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#BC2A2A] text-black pr-10"
      required
    />

    {/* 👁 Show/Hide toggle */}
    <button
      type="button"
      onClick={() => field.setShow((prev) => !prev)}
      className="absolute right-3 top-8 sm:top-9 text-gray-500 hover:scale-110 transition"
    >
      <Image
        src={field.show ? "/resources/icons/hide.png" : "/resources/icons/show.png"}
        alt={field.show ? "Hide Password" : "Show Password"}
        width={27}
        height={22}
      />
    </button>

    {/* ℹ️ Tooltip for password requirements */}
    {field.name === "password" && showPasswordInfo && (
      <div className="absolute top-14 left-0 bg-white border border-gray-300 rounded-md shadow-md p-3 w-64 text-xs z-50">
        <p className="font-semibold text-gray-700 mb-1">Password Requirements:</p>
        <ul className="text-gray-600 space-y-1">
  <li className={passwordStatus.length ? "text-green-600" : "text-red-600"}>
    {passwordStatus.length ? "✔" : "✘"} At least 8 characters
  </li>

  <li className={passwordStatus.capital ? "text-green-600" : "text-red-600"}>
    {passwordStatus.capital ? "✔" : "✘"} At least 1 uppercase letter
  </li>

  <li className={passwordStatus.number ? "text-green-600" : "text-red-600"}>
    {passwordStatus.number ? "✔" : "✘"} At least 1 number
  </li>

  <li className={passwordStatus.special ? "text-green-600" : "text-red-600"}>
    {passwordStatus.special ? "✔" : "✘"} At least 1 special character
  </li>
</ul>

      </div>
    )}

  </div>
))}


          <button
            type="submit"
            disabled={!isValidForm || loading}
            className={`${
              !isValidForm || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#BC2A2A] hover:bg-red-700"
            } text-white font-semibold rounded-md py-2 transition mt-2 text-sm sm:text-base`}
          >
            {loading ? "Registering..." : "Continue"}
          </button>
        </form>

        {/* Terms & Privacy */}
        <p className="text-gray-500 text-xs sm:text-sm mt-4 max-w-xs sm:max-w-sm text-center">
          By clicking continue, you agree to our{" "}
          <span
            className="text-[#BC2A2A] underline cursor-pointer"
            onClick={() => setShowTerms(true)}
          >
            Terms of Service
          </span>{" "}
          and{" "}
          <span
            className="text-[#BC2A2A] underline cursor-pointer"
            onClick={() => setShowPrivacy(true)}
          >
            Privacy Policy
          </span>
          .
        </p>
      </div>

      {/* ✅ Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 sm:w-[28rem] shadow-lg relative text-gray-700">
            <h2 className="text-lg font-bold text-center text-[#BC2A2A] mb-3">
              Terms of Service
            </h2>
            <p className="text-sm leading-relaxed text-justify">
              This learning web app and game are created for educational purposes to help students
              enhance their understanding of Electrical Installation and Maintenance (EIM).
              By using this platform, you agree to use it responsibly and solely for learning.
              Any misuse, exploitation, or unauthorized distribution of the content is strictly prohibited.
            </p>
            <button
              onClick={() => setShowTerms(false)}
              className="mt-5 w-full bg-[#BC2A2A] text-white py-2 rounded-md font-semibold hover:bg-red-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ✅ Privacy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 sm:w-[28rem] shadow-lg relative text-gray-700">
            <h2 className="text-lg font-bold text-center text-[#BC2A2A] mb-3">
              Privacy Policy
            </h2>
            <p className="text-sm leading-relaxed text-justify">
              We value your privacy. All information collected during registration, such as ID number,
              name, and email, is securely stored and used only for academic and progress tracking purposes.
              No personal data will be shared, sold, or disclosed to third parties.
              Your data is protected under institutional data management policies.
            </p>
            <button
              onClick={() => setShowPrivacy(false)}
              className="mt-5 w-full bg-[#BC2A2A] text-white py-2 rounded-md font-semibold hover:bg-red-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ✅ Avatar Selection Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-72 sm:w-96 shadow-lg relative">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">
              Choose Your Avatar
            </h2>

            {loadingIcons ? (
              <p className="text-center">Loading avatars...</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 place-items-center">
                {icons.length > 0 ? (
                  icons.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => {
                        setAvatar(img.url);
                        setShowSelector(false);
                      }}
                      className="hover:scale-110 transition"
                    >
                      <Image
                        src={img.url}
                        alt={img.id}
                        width={70}
                        height={70}
                        className={`rounded-full border-2 object-cover ${
                          avatar === img.url
                            ? "border-[#BC2A2A]"
                            : "border-gray-300"
                        }`}
                      />
                    </button>
                  ))
                ) : (
                  <p className="text-center text-sm text-gray-600">
                    No avatars found.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => setShowSelector(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-black text-lg font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
