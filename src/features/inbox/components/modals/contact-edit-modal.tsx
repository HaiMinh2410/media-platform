"use client";

import { cn } from "@shared/lib";
import React, { useState } from "react";
import { X } from "lucide-react";

interface ContactEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData: {
    name?: string;
    avatar?: string;
    phone?: string;
    email?: string;
    birthday?: string | Date;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

export function ContactEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ContactEditModalProps) {
  const [formData, setFormData] = useState({
    phone: initialData.phone || "",
    email: initialData.email || "",
    birthdayMonth: "",
    birthdayDay: "",
    address: initialData.address || "",
    city: initialData.city || "",
    state: initialData.state || "",
    zipCode: initialData.zipCode || "",
  });

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const dataToSave = {
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zipCode,
      birthday:
        formData.birthdayMonth && formData.birthdayDay
          ? new Date(
              2000,
              parseInt(formData.birthdayMonth) - 1,
              parseInt(formData.birthdayDay),
            )
          : undefined,
    };
    onSave(dataToSave);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-10000 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-base-100 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-base-content/10 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 flex justify-between items-center border-b border-base-content/5 bg-base-200/30">
          <h2 className="text-lg font-bold text-base-content m-0">
            Chỉnh sửa thông tin liên hệ
          </h2>
          <button
            className="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-base-content cursor-pointer"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto scrollbar-thin">
          <div className="flex items-center gap-4">
            {/* Left Column: Avatar Preview */}
            <div className="shrink-0 flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-base-200 flex items-center justify-center border-2 border-base-content/10 shadow-lg select-none">
                {initialData.avatar ? (
                  <img
                    src={initialData.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-base-content/40">
                    {initialData.name?.charAt(0) || "U"}
                  </span>
                )}
              </div>
            </div>

            {/* Right Column: Form Fields */}
            <div className="flex flex-1 flex-col gap-4">
              {/* Phone Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-base-content/60">
                  Số điện thoại{" "}
                </label>
                <div className="flex gap-2">
                  <select className="select select-bordered w-[90px] rounded-lg bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all cursor-pointer">
                    <option value="+84">+84</option>
                    <option value="+1">+1</option>
                  </select>
                  <input
                    type="text"
                    name="phone"
                    className="input input-bordered flex-1 rounded-lg bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30"
                    placeholder="Nhập số điện thoại..."
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Birthday Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-base-content/60">
                  Ngày sinh{" "}
                </label>
                <div className="flex gap-2">
                  <select
                    name="birthdayMonth"
                    className="select select-bordered flex-1 rounded-lg bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all cursor-pointer"
                    value={formData.birthdayMonth}
                    onChange={handleChange}
                  >
                    <option value="">Tháng</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Tháng {i + 1}
                      </option>
                    ))}
                  </select>
                  <select
                    name="birthdayDay"
                    className="select select-bordered flex-1 rounded-lg bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all cursor-pointer"
                    value={formData.birthdayDay}
                    onChange={handleChange}
                  >
                    <option value="">Ngày</option>
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-base-content/60">
                Email{" "}
              </label>
              <input
                type="email"
                name="email"
                className="input input-bordered w-full rounded-lg bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Address Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm whitespace-nowrap text-base-content/60">
                Địa chỉ{" "}
              </label>
              <input
                type="text"
                name="address"
                className="input input-bordered w-full rounded-lg bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30"
                placeholder="123 Đường ABC..."
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            {/* City, State, Zip Code Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-2sm text-base-content/50 truncate">
                  Thành phố
                </label>
                <input
                  type="text"
                  name="city"
                  className="input input-bordered w-full rounded-lg bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30 text-sm"
                  placeholder="Thành phố..."
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-2sm text-base-content/50 truncate">
                  Tiểu bang
                </label>
                <input
                  type="text"
                  name="state"
                  className="input input-bordered w-full rounded-lg bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30 text-sm"
                  placeholder="Bang..."
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-2sm text-base-content/50 truncate">
                  Mã bưu chính
                </label>
                <input
                  type="text"
                  name="zipCode"
                  className="input input-bordered w-full rounded-lg bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30 text-sm"
                  placeholder="Mã Zip..."
                  value={formData.zipCode}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-base-content/5 flex justify-end gap-3 bg-base-200/30">
          <button
            type="button"
            className="btn btn-primary px-8 rounded-xl font-bold shadow-lg shadow-primary/20 hover:-translate-y-px active:translate-y-0"
            onClick={handleSave}
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
