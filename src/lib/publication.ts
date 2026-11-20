// Publication facts and author biography checked against the publisher on 2026-11-20.
// Shared locally by the homepage, book page and about page.
export const publication = {
  title: "FDE前线部署工程师",
  subtitle: "企业AI转型与智能体工程化交付",
  author: "邴越",
  publisher: "清华大学出版社",
  isbn: "9787302729556",
  publishedAt: "2026-11-01",
  publicationLabel: "2026 年 11 月",
  cover: "/books/fde-frontline-cover.png",
  portrait: "/books/bingyue-portrait.png",
  publisherUrl:
    "https://www.tup.tsinghua.edu.cn/booksCenter/book_11842501.html",
  description:
    "围绕企业AI从试点走向生产的过程，梳理FDE的角色与能力，串联业务调研、PoC验证、知识工程、智能体开发及评测交付，并结合制造业、电商与出海场景展开讨论。",
  topics: ["业务调研与价值验证", "知识工程与智能体", "评测治理与生产交付"],
  authorRole: "企业AI转型顾问 · FDE实践者",
  authorBio:
    "邴越拥有十余年软件研发、技术管理与企业数智化实践经验，曾在阿里巴巴、美团点评、快手、搜狐等企业工作。近年来关注企业AI转型和智能体工程交付，将业务现场的问题与工程实践结合。",
  authorFocus:
    "实践方向涵盖企业知识库、智能制造、跨境电商和营销增长，同时参与FDE人才培养与经验分享。",
  readingDirections: [
    {
      title: "理解角色与协作",
      description: "适合希望理解FDE职责、建立业务与工程协作视角的从业者。",
    },
    {
      title: "串联工程交付过程",
      description: "适合正在开展知识工程、智能体开发和上线验收的技术团队。",
    },
    {
      title: "带着业务问题阅读",
      description: "适合需要判断场景价值、推进AI试点的企业与业务负责人。",
    },
  ],
} as const;
