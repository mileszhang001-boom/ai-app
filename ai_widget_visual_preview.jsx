import { useState } from "react";

const DARK = {
  bg: "#0e1013",
  cardBg: "#161a1f",
  cardBorder: "rgba(255,255,255,0.04)",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.55)",
  textTertiary: "rgba(255,255,255,0.3)",
  accent: "#FF6A00",
};

const LIGHT = {
  bg: "#e4e9f0",
  cardBg: "rgba(255,255,255,0.85)",
  cardBorder: "rgba(0,0,0,0.04)",
  textPrimary: "#1a1a2e",
  textSecondary: "rgba(0,0,0,0.45)",
  textTertiary: "rgba(0,0,0,0.25)",
  accent: "#FF6A00",
};

// Widget component: Anniversary - Love theme
function LoveWidget({ theme }) {
  const t = theme;
  const days = 1096;
  return (
    <div style={{
      width: "100%", height: "100%",
      borderRadius: 20,
      background: t === "dark"
        ? "linear-gradient(155deg, #1a0e20 0%, #1e1428 35%, #1a1025 70%, #140e1a 100%)"
        : "linear-gradient(155deg, #fdf2f8 0%, #fce7f3 40%, #f5e6ff 100%)",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      padding: "32px 28px",
      boxSizing: "border-box",
      border: t === "dark" ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.03)",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute",
        top: "15%", right: "-5%",
        width: 180, height: 180,
        borderRadius: "50%",
        background: t === "dark"
          ? "radial-gradient(circle, rgba(200,120,180,0.12) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(200,120,180,0.15) 0%, transparent 70%)",
        filter: "blur(30px)",
      }} />
      {/* Second glow */}
      <div style={{
        position: "absolute",
        bottom: "25%", left: "-10%",
        width: 140, height: 140,
        borderRadius: "50%",
        background: t === "dark"
          ? "radial-gradient(circle, rgba(255,150,100,0.08) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(255,150,100,0.1) 0%, transparent 70%)",
        filter: "blur(25px)",
      }} />
      {/* Ambient light line */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0,
        width: "55%", height: 1,
        background: t === "dark"
          ? "linear-gradient(90deg, rgba(220,140,180,0.4) 0%, rgba(220,140,180,0) 100%)"
          : "linear-gradient(90deg, rgba(200,100,160,0.3) 0%, rgba(200,100,160,0) 100%)",
        borderRadius: 1,
      }} />
      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: "'DIN Alternate', 'SF Pro Display', 'Helvetica Neue', system-ui",
          fontSize: 88,
          fontWeight: 300,
          letterSpacing: -3,
          lineHeight: 0.9,
          color: t === "dark" ? "#fff" : "#2d1b3e",
          marginBottom: 6,
          background: t === "dark"
            ? "linear-gradient(180deg, #ffffff 20%, rgba(255,255,255,0.6) 100%)"
            : "linear-gradient(180deg, #2d1b3e 20%, rgba(45,27,62,0.65) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          {days}
        </div>
        <div style={{
          fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: t === "dark" ? "rgba(220,160,190,0.5)" : "rgba(150,80,120,0.5)",
          marginBottom: 28,
        }}>
          days together
        </div>
        <div style={{
          width: 24, height: 1,
          background: t === "dark" ? "rgba(220,160,190,0.2)" : "rgba(150,80,120,0.2)",
          marginBottom: 14,
        }} />
        <div style={{
          fontFamily: "'SF Pro Text', 'Noto Sans SC', system-ui",
          fontSize: 15,
          fontWeight: 400,
          color: t === "dark" ? "rgba(255,255,255,0.75)" : "rgba(45,27,62,0.75)",
          marginBottom: 5,
          letterSpacing: 0.3,
        }}>
          每一天都算数
        </div>
        <div style={{
          fontFamily: "'SF Pro Text', 'Noto Sans SC', system-ui",
          fontSize: 12,
          fontWeight: 400,
          color: t === "dark" ? "rgba(255,255,255,0.3)" : "rgba(45,27,62,0.35)",
          letterSpacing: 0.2,
        }}>
          在一起 · 恋爱纪念日
        </div>
      </div>
    </div>
  );
}

// Widget: Holiday countdown
function HolidayWidget({ theme }) {
  const t = theme;
  return (
    <div style={{
      width: "100%", height: "100%",
      borderRadius: 20,
      background: t === "dark"
        ? "linear-gradient(140deg, #1a2a1a 0%, #0f1a12 100%)"
        : "linear-gradient(140deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%)",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "32px 28px",
      boxSizing: "border-box",
      border: t === "dark" ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.03)",
    }}>
      {/* Top right glow */}
      <div style={{
        position: "absolute",
        top: "-10%", right: "-15%",
        width: 200, height: 200,
        borderRadius: "50%",
        background: t === "dark"
          ? "radial-gradient(circle, rgba(80,200,120,0.1) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)",
        filter: "blur(35px)",
      }} />
      {/* Bottom left glow */}
      <div style={{
        position: "absolute",
        bottom: "10%", left: "-10%",
        width: 160, height: 160,
        borderRadius: "50%",
        background: t === "dark"
          ? "radial-gradient(circle, rgba(100,220,160,0.06) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)",
        filter: "blur(30px)",
      }} />
      {/* Ambient line */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0,
        width: "50%", height: 1,
        background: t === "dark"
          ? "linear-gradient(90deg, rgba(80,200,120,0.35) 0%, transparent 100%)"
          : "linear-gradient(90deg, rgba(34,197,94,0.25) 0%, transparent 100%)",
      }} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{
          fontFamily: "'SF Pro Text', 'Noto Sans SC', system-ui",
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: t === "dark" ? "rgba(120,220,160,0.45)" : "rgba(22,163,74,0.45)",
          marginBottom: 20,
        }}>
          countdown
        </div>
        <div style={{
          fontFamily: "'DIN Alternate', 'SF Pro Display', system-ui",
          fontSize: 104,
          fontWeight: 200,
          letterSpacing: -4,
          lineHeight: 0.85,
          marginBottom: 4,
          background: t === "dark"
            ? "linear-gradient(180deg, #ffffff 15%, rgba(255,255,255,0.55) 100%)"
            : "linear-gradient(180deg, #14532d 15%, rgba(20,83,45,0.55) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          47
        </div>
        <div style={{
          fontFamily: "'SF Pro Display', system-ui",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: t === "dark" ? "rgba(120,220,160,0.4)" : "rgba(22,163,74,0.35)",
          marginBottom: 32,
        }}>
          days
        </div>
        <div style={{
          width: 20, height: 1,
          background: t === "dark" ? "rgba(120,220,160,0.15)" : "rgba(22,163,74,0.15)",
          margin: "0 auto 16px",
        }} />
        <div style={{
          fontFamily: "'SF Pro Text', 'Noto Sans SC', system-ui",
          fontSize: 15,
          fontWeight: 400,
          color: t === "dark" ? "rgba(255,255,255,0.7)" : "rgba(20,83,45,0.7)",
          marginBottom: 5,
        }}>
          假期在向你招手
        </div>
        <div style={{
          fontFamily: "'SF Pro Text', 'Noto Sans SC', system-ui",
          fontSize: 12,
          color: t === "dark" ? "rgba(255,255,255,0.25)" : "rgba(20,83,45,0.3)",
        }}>
          国庆快乐 · 放假倒计时
        </div>
      </div>
    </div>
  );
}

// Widget: Baby days
function BabyWidget({ theme }) {
  const t = theme;
  return (
    <div style={{
      width: "100%", height: "100%",
      borderRadius: 20,
      background: t === "dark"
        ? "linear-gradient(160deg, #141825 0%, #1a1e2e 40%, #151a28 100%)"
        : "linear-gradient(160deg, #eff6ff 0%, #e0f2fe 40%, #f0f4ff 100%)",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      padding: "32px 28px",
      boxSizing: "border-box",
      border: t === "dark" ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.03)",
    }}>
      <div style={{
        position: "absolute",
        top: "20%", left: "50%",
        width: 200, height: 200,
        borderRadius: "50%",
        background: t === "dark"
          ? "radial-gradient(circle, rgba(120,160,255,0.07) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 70%)",
        filter: "blur(35px)",
        transform: "translateX(-50%)",
      }} />
      <div style={{
        position: "absolute",
        bottom: 0, left: 0,
        width: "45%", height: 1,
        background: t === "dark"
          ? "linear-gradient(90deg, rgba(140,180,255,0.3) 0%, transparent 100%)"
          : "linear-gradient(90deg, rgba(96,165,250,0.25) 0%, transparent 100%)",
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: "'DIN Alternate', 'SF Pro Display', system-ui",
          fontSize: 88,
          fontWeight: 300,
          letterSpacing: -3,
          lineHeight: 0.9,
          marginBottom: 6,
          background: t === "dark"
            ? "linear-gradient(180deg, #ffffff 20%, rgba(255,255,255,0.6) 100%)"
            : "linear-gradient(180deg, #1e3a5f 20%, rgba(30,58,95,0.6) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          186
        </div>
        <div style={{
          fontFamily: "'SF Pro Display', system-ui",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: t === "dark" ? "rgba(140,180,255,0.4)" : "rgba(59,130,246,0.4)",
          marginBottom: 28,
        }}>
          days growing
        </div>
        <div style={{
          width: 24, height: 1,
          background: t === "dark" ? "rgba(140,180,255,0.15)" : "rgba(59,130,246,0.15)",
          marginBottom: 14,
        }} />
        <div style={{
          fontFamily: "'SF Pro Text', 'Noto Sans SC', system-ui",
          fontSize: 15,
          fontWeight: 400,
          color: t === "dark" ? "rgba(255,255,255,0.75)" : "rgba(30,58,95,0.75)",
          marginBottom: 5,
        }}>
          每一天都是新的奇迹
        </div>
        <div style={{
          fontFamily: "'SF Pro Text', 'Noto Sans SC', system-ui",
          fontSize: 12,
          color: t === "dark" ? "rgba(255,255,255,0.3)" : "rgba(30,58,95,0.35)",
        }}>
          小橙子 · 宝宝成长
        </div>
      </div>
    </div>
  );
}

// Widget: News
function NewsWidget({ theme }) {
  const t = theme;
  const d = t === "dark" ? DARK : LIGHT;
  const news = [
    { tag: "科技", title: "OpenAI 发布 GPT-5，推理能力大幅提升", time: "2小时前" },
    { tag: "汽车", title: "小米汽车 Q2 交付量突破新高", time: "4小时前" },
    { tag: "财经", title: "A股三大指数集体上涨，新能源板块领涨", time: "5小时前" },
  ];
  return (
    <div style={{
      width: "100%", height: "100%",
      borderRadius: 20,
      background: t === "dark"
        ? "linear-gradient(180deg, #111316 0%, #0e1013 100%)"
        : "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      padding: "28px 24px",
      boxSizing: "border-box",
      border: `1px solid ${d.cardBorder}`,
    }}>
      <div style={{
        position: "absolute",
        bottom: 0, left: 0,
        width: "40%", height: 1,
        background: `linear-gradient(90deg, rgba(255,106,0,0.3) 0%, transparent 100%)`,
      }} />
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
        <div style={{
          width: 3, height: 14, borderRadius: 2,
          background: "#FF6A00",
          marginRight: 10,
        }} />
        <div style={{
          fontFamily: "'SF Pro Text', 'Noto Sans SC', system-ui",
          fontSize: 14,
          fontWeight: 600,
          color: d.textPrimary,
          letterSpacing: 0.5,
        }}>
          每日速览
        </div>
        <div style={{
          marginLeft: "auto",
          fontFamily: "'SF Pro Text', system-ui",
          fontSize: 11,
          color: d.textTertiary,
        }}>
          今日 · 3月7日
        </div>
      </div>
      {/* News list */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {news.map((item, i) => (
          <div key={i}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{
                flexShrink: 0,
                padding: "2px 6px",
                borderRadius: 4,
                background: t === "dark" ? "rgba(255,106,0,0.1)" : "rgba(255,106,0,0.08)",
                fontFamily: "'SF Pro Text', system-ui",
                fontSize: 10,
                fontWeight: 500,
                color: "rgba(255,106,0,0.7)",
                marginTop: 2,
              }}>
                {item.tag}
              </div>
              <div>
                <div style={{
                  fontFamily: "'SF Pro Text', 'Noto Sans SC', system-ui",
                  fontSize: 14,
                  fontWeight: 400,
                  color: t === "dark" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)",
                  lineHeight: 1.45,
                  marginBottom: 4,
                }}>
                  {item.title}
                </div>
                <div style={{
                  fontFamily: "'SF Pro Text', system-ui",
                  fontSize: 11,
                  color: d.textTertiary,
                }}>
                  {item.time}
                </div>
              </div>
            </div>
            {i < news.length - 1 && (
              <div style={{
                height: 1, margin: "14px 0",
                background: t === "dark"
                  ? "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)"
                  : "linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.01) 100%)",
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Widget: Alarm
function AlarmWidget({ theme }) {
  const t = theme;
  return (
    <div style={{
      width: "100%", height: "100%",
      borderRadius: 20,
      background: t === "dark"
        ? "linear-gradient(180deg, #111316 0%, #0e1013 100%)"
        : "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "32px 28px",
      boxSizing: "border-box",
      border: t === "dark" ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.03)",
    }}>
      <div style={{
        position: "absolute",
        bottom: 0, left: 0,
        width: "45%", height: 1,
        background: `linear-gradient(90deg, rgba(255,106,0,0.3) 0%, transparent 100%)`,
      }} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{
          fontFamily: "'SF Pro Text', system-ui",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: t === "dark" ? "rgba(255,106,0,0.4)" : "rgba(255,106,0,0.35)",
          marginBottom: 20,
        }}>
          next alarm
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", marginBottom: 6 }}>
          <span style={{
            fontFamily: "'DIN Alternate', 'SF Pro Display', system-ui",
            fontSize: 80,
            fontWeight: 300,
            letterSpacing: -2,
            background: t === "dark"
              ? "linear-gradient(180deg, #ffffff 20%, rgba(255,255,255,0.55) 100%)"
              : "linear-gradient(180deg, #1a1a2e 20%, rgba(26,26,46,0.55) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            07:30
          </span>
        </div>
        <div style={{
          fontFamily: "'SF Pro Display', system-ui",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: t === "dark" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)",
          marginBottom: 32,
        }}>
          weekdays
        </div>
        <div style={{
          width: 20, height: 1,
          background: t === "dark" ? "rgba(255,106,0,0.15)" : "rgba(255,106,0,0.12)",
          margin: "0 auto 16px",
        }} />
        <div style={{
          fontFamily: "'SF Pro Text', 'Noto Sans SC', system-ui",
          fontSize: 15,
          color: t === "dark" ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)",
          marginBottom: 5,
        }}>
          早起的鸟儿有虫吃
        </div>
        <div style={{
          fontFamily: "'SF Pro Text', 'Noto Sans SC', system-ui",
          fontSize: 12,
          color: t === "dark" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)",
        }}>
          工作日闹钟
        </div>
      </div>
    </div>
  );
}

// Love alternative: warm orange
function LoveWarmWidget({ theme }) {
  const t = theme;
  return (
    <div style={{
      width: "100%", height: "100%",
      borderRadius: 20,
      background: t === "dark"
        ? "linear-gradient(150deg, #1f1510 0%, #261a12 40%, #1a1210 100%)"
        : "linear-gradient(150deg, #fff7ed 0%, #ffedd5 40%, #fef3c7 100%)",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "32px 28px",
      boxSizing: "border-box",
      border: t === "dark" ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.03)",
    }}>
      <div style={{
        position: "absolute",
        top: "20%", right: "0%",
        width: 180, height: 180,
        borderRadius: "50%",
        background: t === "dark"
          ? "radial-gradient(circle, rgba(255,140,60,0.08) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(251,146,60,0.1) 0%, transparent 70%)",
        filter: "blur(30px)",
      }} />
      <div style={{
        position: "absolute",
        bottom: 0, left: 0,
        width: "50%", height: 1,
        background: t === "dark"
          ? "linear-gradient(90deg, rgba(255,150,60,0.35) 0%, transparent 100%)"
          : "linear-gradient(90deg, rgba(234,88,12,0.2) 0%, transparent 100%)",
      }} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{
          fontFamily: "'SF Pro Text', system-ui",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: t === "dark" ? "rgba(255,180,100,0.4)" : "rgba(194,65,12,0.35)",
          marginBottom: 20,
        }}>
          anniversary
        </div>
        <div style={{
          fontFamily: "'DIN Alternate', 'SF Pro Display', system-ui",
          fontSize: 96,
          fontWeight: 200,
          letterSpacing: -3,
          lineHeight: 0.85,
          marginBottom: 6,
          background: t === "dark"
            ? "linear-gradient(180deg, #ffffff 15%, rgba(255,255,255,0.55) 100%)"
            : "linear-gradient(180deg, #7c2d12 15%, rgba(124,45,18,0.55) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          365
        </div>
        <div style={{
          fontFamily: "'SF Pro Display', system-ui",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: t === "dark" ? "rgba(255,180,100,0.35)" : "rgba(194,65,12,0.3)",
          marginBottom: 32,
        }}>
          days
        </div>
        <div style={{
          width: 20, height: 1,
          background: t === "dark" ? "rgba(255,180,100,0.15)" : "rgba(194,65,12,0.12)",
          margin: "0 auto 16px",
        }} />
        <div style={{
          fontFamily: "'SF Pro Text', 'Noto Sans SC', system-ui",
          fontSize: 15,
          color: t === "dark" ? "rgba(255,255,255,0.7)" : "rgba(124,45,18,0.7)",
          marginBottom: 5,
        }}>
          最好的时光是有你的日子
        </div>
        <div style={{
          fontFamily: "'SF Pro Text', 'Noto Sans SC', system-ui",
          fontSize: 12,
          color: t === "dark" ? "rgba(255,255,255,0.25)" : "rgba(124,45,18,0.3)",
        }}>
          结婚一周年 · 纪念日
        </div>
      </div>
    </div>
  );
}

const WIDGETS = [
  { name: "恋爱纪念", comp: LoveWidget, cat: "情感" },
  { name: "放假倒计时", comp: HolidayWidget, cat: "情感" },
  { name: "宝宝成长", comp: BabyWidget, cat: "情感" },
  { name: "暖橙纪念", comp: LoveWarmWidget, cat: "情感" },
  { name: "每日速览", comp: NewsWidget, cat: "实用" },
  { name: "闹钟", comp: AlarmWidget, cat: "实用" },
];

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [selected, setSelected] = useState(0);
  const t = theme;
  const bg = t === "dark" ? DARK : LIGHT;

  return (
    <div style={{
      minHeight: "100vh",
      background: t === "dark"
        ? "linear-gradient(180deg, #0a0b0d 0%, #0e1013 100%)"
        : "linear-gradient(180deg, #dde3eb 0%, #e4e9f0 100%)",
      padding: "32px 24px",
      fontFamily: "'SF Pro Text', 'Noto Sans SC', system-ui",
      transition: "background 0.5s ease",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 28, maxWidth: 800, margin: "0 auto 28px",
      }}>
        <div>
          <div style={{
            fontSize: 20, fontWeight: 600, letterSpacing: -0.3,
            color: bg.textPrimary,
          }}>
            AI小组件 · 视觉预览
          </div>
          <div style={{ fontSize: 13, color: bg.textSecondary, marginTop: 4 }}>
            设计语言：Ambient Light · 基于小米 SU7 车机界面
          </div>
        </div>
        <div style={{
          display: "flex", gap: 4, padding: 3,
          background: t === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          borderRadius: 10,
        }}>
          {["dark", "light"].map(m => (
            <button key={m} onClick={() => setTheme(m)} style={{
              padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500,
              background: theme === m
                ? (t === "dark" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.9)")
                : "transparent",
              color: theme === m ? bg.textPrimary : bg.textSecondary,
              transition: "all 0.2s",
            }}>
              {m === "dark" ? "深色" : "浅色"}
            </button>
          ))}
        </div>
      </div>

      {/* Widget selector */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 32, maxWidth: 800, margin: "0 auto 32px",
        overflowX: "auto", padding: "0 0 8px",
      }}>
        {WIDGETS.map((w, i) => (
          <button key={i} onClick={() => setSelected(i)} style={{
            padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
            background: selected === i
              ? (t === "dark" ? "rgba(255,106,0,0.15)" : "rgba(255,106,0,0.1)")
              : (t === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"),
            color: selected === i
              ? "#FF6A00"
              : bg.textSecondary,
            transition: "all 0.2s",
          }}>
            {w.name}
          </button>
        ))}
      </div>

      {/* Main display area */}
      <div style={{
        maxWidth: 800, margin: "0 auto",
        display: "flex", gap: 32, justifyContent: "center",
        alignItems: "flex-start", flexWrap: "wrap",
      }}>
        {/* Large preview - simulated card on car dashboard */}
        <div>
          <div style={{ fontSize: 11, color: bg.textTertiary, marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>
            车机 1/3 屏卡片 · 896×1464
          </div>
          <div style={{
            width: 240, height: 392,
            borderRadius: 22,
            overflow: "hidden",
            boxShadow: t === "dark"
              ? "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)"
              : "0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)",
            transition: "all 0.4s ease",
          }}>
            {(() => {
              const W = WIDGETS[selected].comp;
              return <W theme={t} />;
            })()}
          </div>
        </div>

        {/* All 6 widgets in small grid */}
        <div>
          <div style={{ fontSize: 11, color: bg.textTertiary, marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>
            全部组件一览
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}>
            {WIDGETS.map((w, i) => (
              <div key={i} onClick={() => setSelected(i)} style={{ cursor: "pointer" }}>
                <div style={{
                  width: 130, height: 212,
                  borderRadius: 14,
                  overflow: "hidden",
                  opacity: selected === i ? 1 : 0.65,
                  transform: selected === i ? "scale(1)" : "scale(0.97)",
                  transition: "all 0.3s ease",
                  boxShadow: selected === i
                    ? (t === "dark" ? "0 0 0 2px rgba(255,106,0,0.3)" : "0 0 0 2px rgba(255,106,0,0.25)")
                    : "none",
                }}>
                  {(() => {
                    const W = w.comp;
                    return <W theme={t} />;
                  })()}
                </div>
                <div style={{
                  fontSize: 11, color: selected === i ? bg.textPrimary : bg.textTertiary,
                  marginTop: 6, textAlign: "center", transition: "color 0.2s",
                }}>
                  {w.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Design notes */}
      <div style={{
        maxWidth: 800, margin: "40px auto 0",
        padding: "20px 24px",
        borderRadius: 14,
        background: t === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
        border: `1px solid ${bg.cardBorder}`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: bg.textPrimary, marginBottom: 10 }}>
          Ambient Light 设计语言
        </div>
        <div style={{ fontSize: 12, color: bg.textSecondary, lineHeight: 1.8 }}>
          深色空间中的精确信息 · 极端字号对比（数字超大超轻 vs 辅助信息极小极淡）· 每种组件有专属色调但统一遵循车机配色体系 · 底部氛围光线贯穿所有组件 · 小米橙作为实用类组件的系统级强调色 · 情感类组件使用主题专属色调（玫瑰/翠绿/靛蓝/暖橙）· 信息最多3层，内容占比 ≤ 45%
        </div>
      </div>
    </div>
  );
}
