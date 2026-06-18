import type { Metadata } from "next";
import ThemeToggle from "@/components/ThemeToggle";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Tag from "@/components/ui/Tag";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import StatBand from "@/components/ui/StatBand";

export const metadata: Metadata = { title: "Styleguide — CTS Lab", robots: { index: false } };

export default function StyleguidePage() {
  return (
    <main className="section">
      <Container>
        <div className="mb-10 flex items-center justify-between">
          <div>
            <span className="eyebrow">Design system</span>
            <h1 className="text-hero text-ink">Academic Tech</h1>
          </div>
          <ThemeToggle />
        </div>

        <SectionHeader eyebrow="Buttons" title="Nút" cta={{ label: "Xem tất cả →", href: "#" }} />
        <div className="mb-12 flex flex-wrap gap-3">
          <Button variant="blue">Khám phá</Button>
          <Button variant="red">Tham quan VR ▸</Button>
          <Button variant="ghost">Đăng nhập</Button>
          <Button variant="blue" size="sm">Nhỏ</Button>
        </div>

        <SectionHeader eyebrow="Surfaces" title="Thẻ & nhãn" />
        <div className="mb-12 grid gap-4 md:grid-cols-3">
          <Card>
            <Badge tone="blue">AI</Badge>
            <h3 className="text-display mt-3 text-lg text-ink">Card chuẩn</h3>
            <p className="mt-2 text-sm text-ink-2">Mô tả ngắn dùng tông trung tính.</p>
            <div className="mt-3 flex gap-2"><Tag>STEM</Tag><Tag>VR</Tag></div>
          </Card>
          <Card variant="feature">
            <span className="absolute right-4 top-4"><Badge tone="red">MỚI</Badge></span>
            <h3 className="text-display text-lg text-ink">Card feature</h3>
            <p className="mt-2 text-sm text-ink-2">Điểm nhấn đỏ — dùng tiết chế.</p>
          </Card>
          <Card>
            <h3 className="text-display text-lg text-ink">Tông chữ</h3>
            <p className="mt-2 text-sm text-ink">Ink chính</p>
            <p className="text-sm text-ink-2">Ink phụ</p>
            <p className="text-sm text-dim">Dim</p>
          </Card>
        </div>

        <SectionHeader eyebrow="Data" title="Dải số liệu" />
        <StatBand
          items={[
            { value: "04", unit: "+", label: "Sản phẩm AI" },
            { value: "164", label: "Cảnh VR 360°" },
            { value: "12", unit: "k", label: "Học sinh tiếp cận" },
            { value: "PTIT", label: "Đối tác học thuật" },
          ]}
        />
      </Container>
    </main>
  );
}
