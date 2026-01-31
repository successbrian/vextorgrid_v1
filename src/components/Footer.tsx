import { Facebook, Linkedin, Twitter, Youtube, Instagram, Video, Music, Mail } from 'lucide-react';

interface FooterProps {
  variant?: 'public' | 'internal';
}

export function Footer({ variant = 'internal' }: FooterProps) {
  return (
    <footer className="bg-[#1a1a1a] py-6">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <img
                src="/vextorgrid_logo_1a1a1a_background_12_25_2025.png"
                alt="VextorGrid.com"
                className="h-20"
              />
              <div className="text-gray-500 text-xs" style={{ fontFamily: 'monospace' }}>
                © 2025 VextorGrid.com
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <div className="w-[728px] h-[90px] bg-[#252525] border-2 border-[#333] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-[#008080] font-bold text-sm mb-1" style={{ fontFamily: 'monospace' }}>
                      SPONSOR THIS SPACE
                    </div>
                    <div className="text-gray-500 text-xs">
                      Contact for rates
                    </div>
                  </div>
                </div>
              </div>
              {variant === 'public' ? (
                <div className="flex items-center gap-3">
                  <a
                    href="https://fb.com/successbrian"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#008080] transition-colors"
                  >
                    <Facebook size={24} />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/brian-lathe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#008080] transition-colors"
                  >
                    <Linkedin size={24} />
                  </a>
                  <a
                    href="https://www.youtube.com/@AIProfits2025"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#008080] transition-colors"
                  >
                    <Youtube size={24} />
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <a
                      href="https://fb.com/successbrian"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#008080] transition-colors"
                    >
                      <Facebook size={22} />
                    </a>
                    <a
                      href="https://www.linkedin.com/in/brian-lathe"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#008080] transition-colors"
                    >
                      <Linkedin size={22} />
                    </a>
                    <a
                      href="https://x.com/magausnavyvet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#008080] transition-colors"
                    >
                      <Twitter size={22} />
                    </a>
                    <a
                      href="https://www.youtube.com/@AIProfits2025"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#008080] transition-colors"
                    >
                      <Youtube size={22} />
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://rumble.com/c/successbrian"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#008080] transition-colors"
                    >
                      <Video size={22} />
                    </a>
                    <a
                      href="https://www.instagram.com/successbrian"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#008080] transition-colors"
                    >
                      <Instagram size={22} />
                    </a>
                    <a
                      href="https://www.tiktok.com/@success.brian"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#008080] transition-colors"
                    >
                      <Music size={22} />
                    </a>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-[#008080] transition-colors cursor-not-allowed opacity-50"
                      title="Substack (coming soon)"
                    >
                      <Mail size={22} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="md:hidden flex justify-center">
              {variant === 'public' ? (
                <div className="flex items-center gap-3">
                  <a
                    href="https://fb.com/successbrian"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#008080] transition-colors"
                  >
                    <Facebook size={24} />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/brian-lathe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#008080] transition-colors"
                  >
                    <Linkedin size={24} />
                  </a>
                  <a
                    href="https://www.youtube.com/@AIProfits2025"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#008080] transition-colors"
                  >
                    <Youtube size={24} />
                  </a>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <a
                    href="https://fb.com/successbrian"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#008080] transition-colors"
                  >
                    <Facebook size={22} />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/brian-lathe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#008080] transition-colors"
                  >
                    <Linkedin size={22} />
                  </a>
                  <a
                    href="https://x.com/magausnavyvet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#008080] transition-colors"
                  >
                    <Twitter size={22} />
                  </a>
                  <a
                    href="https://www.youtube.com/@AIProfits2025"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#008080] transition-colors"
                  >
                    <Youtube size={22} />
                  </a>
                  <a
                    href="https://rumble.com/c/successbrian"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#008080] transition-colors"
                  >
                    <Video size={22} />
                  </a>
                  <a
                    href="https://www.instagram.com/successbrian"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#008080] transition-colors"
                  >
                    <Instagram size={22} />
                  </a>
                  <a
                    href="https://www.tiktok.com/@success.brian"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#008080] transition-colors"
                  >
                    <Music size={22} />
                  </a>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-[#008080] transition-colors cursor-not-allowed opacity-50"
                    title="Substack (coming soon)"
                  >
                    <Mail size={22} />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="md:hidden flex flex-col items-center gap-1">
            <div className="w-[320px] h-[50px] bg-[#252525] border-2 border-[#333] flex items-center justify-center">
              <div className="text-center">
                <div className="text-[#008080] font-bold text-xs mb-0.5" style={{ fontFamily: 'monospace' }}>
                  SPONSOR THIS SPACE
                </div>
                <div className="text-gray-500 text-xs">
                  Contact for rates
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
