/* ملف المحتوى: عدّل هذا الملف فقط لتحديث الموقع. انسخ أي كتلة { ... } وغيّر النص.
   status: open (مفتوح للتسجيل) | upcoming (قريباً) | done (مكتملة)
   photo: اسم ملف داخل مجلد photos، مثل "workshop1.jpg". اتركه فارغاً لعرض إطار مؤقت.
   sample: true تعني مثالاً تجريبياً يظهر عليه وسم "مثال تجريبي". احذفه عند إضافة محتوى حقيقي. */
window.MEDAURA = {
  impact: {
    studentsReached: null, // عدّلها لعدد الطلاب المستفيدين الفعلي، مثال: 240
    impactLabel: "طالب وطالبة استفادوا من MEDAURA"
  },
  links: {          // روابط حقيقية فقط. اتركها فارغة إن لم تتوفر.
    joinForm: "",   // رابط نموذج Google للانضمام
    contactForm: "",
    partnerForm: "",
    email: "", instagram: "", telegram: ""
  },
  courses: [
    { id: "sample-skills", sample: true, title: "عنوان الدورة", cat: "المهارات السريرية", level: "مبتدئ",
      duration: "تُحدَّد لاحقاً", format: "حضوري", status: "open", instructor: "اسم المحاضر المعتمد", photo: "", register: "",
      summary: "وصف مختصر للدورة يُكتب هنا بعد اعتماد المحتوى.",
      goals: ["الهدف التعليمي الأول", "الهدف التعليمي الثاني"] },
    { id: "sample-ecg", sample: true, title: "عنوان دورة أخرى", cat: "تخطيط القلب", level: "مبتدئ",
      duration: "تُحدَّد لاحقاً", format: "عن بُعد", status: "upcoming", instructor: "اسم المحاضر المعتمد", photo: "", register: "",
      summary: "وصف مختصر للدورة يُكتب هنا بعد اعتماد المحتوى.", goals: ["الهدف التعليمي الأول"] }
  ],
  events: [
    { id: "sample-event", sample: true, title: "عنوان الفعالية", date: "2026-01-01", place: "", course: "",
      summary: "وصف الفعالية يُكتب هنا.", photos: [] }
  ],
  resources: [
    { title: "عنوان مورد تعليمي", cat: "أدلة دراسية", type: "PDF", url: "", sample: true }
  ]
};
