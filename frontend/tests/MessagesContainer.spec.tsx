import { render, screen } from '@testing-library/react';
import { RecoilRoot, useRecoilValue } from 'recoil';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  IMessageElement,
  sideViewState,
  useChatData
} from '@chainlit/react-client';

import MessagesContainer from '@/components/chat/MessagesContainer';

vi.mock('@chainlit/react-client', async () => {
  const { createContext } = await import('react');
  const { atom } = await import('recoil');

  return {
    ChainlitContext: createContext({}),
    messagesState: atom({ key: 'messagesState', default: [] }),
    sessionIdState: atom({ key: 'sessionIdState', default: undefined }),
    sideViewState: atom({ key: 'sideViewState', default: undefined }),
    updateMessageById: vi.fn(),
    useChatData: vi.fn(),
    useChatInteract: () => ({ uploadFile: vi.fn() }),
    useChatMessages: () => ({ messages: [] }),
    useConfig: () => ({ config: { features: {} } })
  };
});

vi.mock('@/components/chat/Messages', () => ({
  Messages: () => null
}));

vi.mock('@/components/i18n/Translator', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), promise: vi.fn() }
}));

const sideElement = (name: string): IMessageElement => ({
  id: 'side-element',
  name,
  display: 'side',
  type: 'text',
  chainlitKey: null,
  url: null,
  objectKey: null,
  path: null,
  content: null,
  props: null,
  page: null,
  size: null,
  language: null,
  mime: null,
  threadId: null
});

const SideViewObserver = () => {
  const sideView = useRecoilValue(sideViewState);

  return <div>{sideView?.title ?? 'closed'}</div>;
};

const SideViewContentObserver = () => {
  const sideView = useRecoilValue(sideViewState);

  return <div>{sideView?.elements[0]?.content ?? 'no-content'}</div>;
};

describe('MessagesContainer side view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not open the side view when side elements change', () => {
    vi.mocked(useChatData).mockReturnValue({
      elements: [sideElement('Initial')],
      actions: [],
      askUser: undefined,
      loading: false
    } as ReturnType<typeof useChatData>);

    const { rerender } = render(
      <RecoilRoot>
        <MessagesContainer />
        <SideViewObserver />
      </RecoilRoot>
    );

    expect(screen.getByText('closed')).toBeInTheDocument();

    vi.mocked(useChatData).mockReturnValue({
      elements: [sideElement('Updated')],
      actions: [],
      askUser: undefined,
      loading: false
    } as ReturnType<typeof useChatData>);

    rerender(
      <RecoilRoot>
        <MessagesContainer />
        <SideViewObserver />
      </RecoilRoot>
    );

    expect(screen.getByText('closed')).toBeInTheDocument();
  });

  it('clears the side view when no side elements remain', () => {
    const element = sideElement('Open');
    vi.mocked(useChatData).mockReturnValue({
      elements: [element],
      actions: [],
      askUser: undefined,
      loading: false
    } as ReturnType<typeof useChatData>);

    const { rerender } = render(
      <RecoilRoot
        initializeState={({ set }) =>
          set(sideViewState, { title: element.name, elements: [element] })
        }
      >
        <MessagesContainer />
        <SideViewObserver />
      </RecoilRoot>
    );

    expect(screen.getByText('Open')).toBeInTheDocument();

    vi.mocked(useChatData).mockReturnValue({
      elements: [],
      actions: [],
      askUser: undefined,
      loading: false
    } as ReturnType<typeof useChatData>);

    rerender(
      <RecoilRoot>
        <MessagesContainer />
        <SideViewObserver />
      </RecoilRoot>
    );

    expect(screen.getByText('closed')).toBeInTheDocument();
  });

  it('refreshes the open element when its content changes', () => {
    const initialElement = { ...sideElement('Initial'), content: 'version 1' };
    const updatedElement = { ...initialElement, name: 'Updated', content: 'version 2' };

    vi.mocked(useChatData).mockReturnValue({
      elements: [initialElement],
      actions: [],
      askUser: undefined,
      loading: false
    } as ReturnType<typeof useChatData>);

    const { rerender } = render(
      <RecoilRoot
        initializeState={({ set }) =>
          set(sideViewState, { title: 'Custom title', elements: [initialElement] })
        }
      >
        <MessagesContainer />
        <SideViewObserver />
        <SideViewContentObserver />
      </RecoilRoot>
    );

    expect(screen.getByText('Custom title')).toBeInTheDocument();
    expect(screen.getByText('version 1')).toBeInTheDocument();

    vi.mocked(useChatData).mockReturnValue({
      elements: [updatedElement],
      actions: [],
      askUser: undefined,
      loading: false
    } as ReturnType<typeof useChatData>);

    rerender(
      <RecoilRoot>
        <MessagesContainer />
        <SideViewObserver />
        <SideViewContentObserver />
      </RecoilRoot>
    );

    expect(screen.getByText('Custom title')).toBeInTheDocument();
    expect(screen.getByText('version 2')).toBeInTheDocument();
    expect(screen.queryByText('version 1')).not.toBeInTheDocument();
  });
});
