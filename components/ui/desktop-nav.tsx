import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

import {
  companyLinks,
  companyLinks2,
  productLinks,
} from "@/components/ui/nav-links";

import { LinkItem } from "@/components/ui/sheard";

export function DesktopNav() {
  const triggerClassName =
    "bg-transparent text-zinc-300 transition-colors duration-200 hover:bg-black/[0.04] hover:text-white focus:bg-white/[0.04] focus:text-white data-[state=open]:bg-black/[0.04] data-[state=open]:text-white";

  const menuClassName =
    "border border-white/[0.08] bg-zinc-950 p-2 text-zinc-300 shadow-2xl shadow-black/30";

  const panelClassName =
    "rounded-lg border border-white/[0.06] bg-zinc-950 p-2";

  const linkClassName =
    "rounded-md text-zinc-400 transition-colors duration-200 hover:bg-black/[0.05] hover:text-white focus:bg-white/[0.05] focus:text-white";

  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList className="gap-1">
        <NavigationMenuItem>
          <NavigationMenuTrigger className={triggerClassName}>
            Product
          </NavigationMenuTrigger>

          <NavigationMenuContent className={menuClassName}>
            <div className="grid w-lg grid-cols-2 gap-2">
              <div className={panelClassName}>
                <NavigationMenuLink asChild>
                  <div className="space-y-1">
                    {productLinks.map((item, i) => (
                      <NavigationMenuLink
                        asChild
                        key={`product-${item.label}-${i}`}
                      >
                        <LinkItem {...item} />
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuLink>
              </div>

              <div className="flex flex-col justify-end rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-sm text-zinc-500">
                  Interested?
                </p>

                <a
                  className="mt-1 w-fit text-sm font-medium text-zinc-300 transition-colors hover:text-white"
                  href="#"
                >
                  Schedule a demo
                </a>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className={triggerClassName}>
            Company
          </NavigationMenuTrigger>

          <NavigationMenuContent className={menuClassName}>
            <div className="grid w-lg grid-cols-2 gap-2">
              <div className={panelClassName}>
                <div className="space-y-1">
                  {companyLinks.map((item, i) => (
                    <NavigationMenuLink
                      asChild
                      key={`company-${item.label}-${i}`}
                    >
                      <LinkItem {...item} />
                    </NavigationMenuLink>
                  ))}
                </div>
              </div>

              <div className="space-y-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                {companyLinks2.map((item, i) => (
                  <NavigationMenuLink
                    className={linkClassName}
                    href={item.href}
                    key={`company-secondary-${item.label}-${i}`}
                  >
                    <span className="flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </span>
                  </NavigationMenuLink>
                ))}
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <a
              className="rounded-md px-4 py-2 text-sm text-zinc-400 transition-colors duration-200 hover:bg-white/[0.04] hover:text-white focus:bg-white/[0.04] focus:text-white"
              href="#"
            >
              Pricing
            </a>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}