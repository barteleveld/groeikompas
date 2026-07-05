import { DemoShell } from "@/components/layout/demo-shell";
import { DemoStateProvider } from "@/components/demo/demo-state";
export default function Layout({children}:{children:React.ReactNode}){return <DemoStateProvider><DemoShell>{children}</DemoShell></DemoStateProvider>}
