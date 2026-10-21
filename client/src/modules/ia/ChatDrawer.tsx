import { Drawer } from '../../components/ui/Drawer';
import { useUiStore } from '../../stores/uiStore';
import { ChatPanel } from './ChatPanel';

/** Canal Polaris em uma gaveta, disponível em qualquer tela. */
export function ChatDrawer() {
  const { chatOpen, setChatOpen } = useUiStore();
  return (
    <Drawer
      open={chatOpen}
      onClose={() => setChatOpen(false)}
      label="Canal Polaris"
      title="Fale com a Polaris"
      width="max-w-xl"
    >
      <ChatPanel compact />
    </Drawer>
  );
}
