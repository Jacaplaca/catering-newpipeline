import { type FunctionComponent, useEffect, useRef, useState } from "react";
import { Transition } from "@headlessui/react";
import { useOnClickOutside } from 'usehooks-ts';
import useKeyPressed from '@root/app/hooks/useKeyPressed';
import ModalRoot from '@root/app/_components/Modals/ModalRoot';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  disallowBackdropClose?: boolean;
  isMobile?: boolean;
  children: React.ReactNode
};

const ModalBlurWrapper: FunctionComponent<Props> = ({
  isOpen,
  onClose,
  children,
  disallowBackdropClose
}) => {
  const ref = useRef(null);
  const { keyPressed } = useKeyPressed();
  const leaveTimeout = 150;

  const [showComponent, setShowComponent] = useState(false);
  const [blurBackground, setBlurBackground] = useState(false);

  useOnClickOutside(ref, disallowBackdropClose ? () => { return; } : onClose);

  useEffect(() => {
    if (isOpen) {
      setShowComponent(true);
      setTimeout(() => {
        setBlurBackground(true);
      }, 1);
    } else {
      setBlurBackground(false);
      setTimeout(() => {
        setShowComponent(false);
      }, leaveTimeout);
    }

  }, [isOpen]);

  useEffect(() => {
    if (keyPressed === 'Escape' && isOpen) {
      onClose();
    }
  }, [keyPressed, isOpen, onClose]);

  const backgroundAnimation = {
    enter: "transition duration-300",
    enterFrom: "opacity-0",
    enterTo: "opacity-100",
    leave: "transition duration-300",
    leaveFrom: "opacity-100",
    leaveTo: "opacity-0"
  }

  const modalAnimation = {
    enter: "transition duration-[227ms]",
    enterFrom: "rotate-[-15deg] scale-50 opacity-0",
    enterTo: "rotate-0 scale-100 opacity-100",
    leave: "transition duration-200 ease-in-out",
    leaveFrom: "rotate-0 scale-100 opacity-100",
    leaveTo: "scale-95 rotate-[-3deg] opacity-0"
  };

  return (
    <>
      {
        showComponent && (
          <ModalRoot>
            <Transition
              show={isOpen}
              unmount={false}
              {...backgroundAnimation}
            >
              <div
                className={`
                  fixed inset-0
                  flex justify-center items-start
                  px-2 sm:px-4 py-4 sm:py-8
                  ${blurBackground ? 'bg-gray-200/10 dark:bg-gray-800/10 backdrop-blur-sm' : 'bg-transparent'}
                  transition-all duration-300
                  overflow-y-auto
                  `}
              >
                <Transition
                  appear={true}
                  show={isOpen}
                  unmount={false}
                  {...modalAnimation}
                >
                  <div
                    ref={ref}
                  >
                    {children}
                  </div>
                </Transition>
              </div>
            </Transition>
          </ModalRoot>
        )
      }
    </ >
  );
};

export default ModalBlurWrapper;
