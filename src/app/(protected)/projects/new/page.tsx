import { TopBar } from "@/components/layout/TopBar";
import { BenchmarkWizard } from "@/components/projects/BenchmarkWizard";

export default function NewProjectPage() {
  return (
    <>
      <TopBar title="New benchmark" />
      <div className="flex-1 p-6 overflow-y-auto">
        <p className="text-sm text-muted-foreground mb-6 max-w-3xl">
          Create a benchmark by selecting a focus company and peer group. The
          dashboard will compare board composition against percentile
          distributions of the peer pool.
        </p>
        <BenchmarkWizard />
      </div>
    </>
  );
}
