import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { Search } from "lucide-react";
import { AuthButton } from "./auth-button";
const Navbar = () => {
  return (
    <nav className="absolute inset-x-4 h-16   mx-auto ">
      <div className="h-full flex items-center justify-between mx-auto px-4">
        <div className="flex items-center gap-2 md:gap-6">
          <Logo className="shrink-0" />

          <div className="relative hidden md:block">
            <Search className="h-5 w-5 absolute inset-y-0 my-auto left-2.5" />
            <Input
              className="pl-10 flex-1 bg-muted border-none shadow-none w-[280px] rounded-full"
              placeholder="Search"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            className="bg-muted text-foreground hover:bg-accent shadow-none rounded-full md:hidden"
          >
            <Search className="h-5! w-5!" />
          </Button>
          <Button
            variant="outline"
            className="hidden sm:inline-flex rounded-full"
          >
            Sign In
          </Button>
          <Button className="rounded-full">Get Started</Button>
          <AuthButton />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
