'use client';
import ModalBlurWrapper from '@root/app/_components/Modals/ModalBlurWrapper';
import Tooltip from '@root/app/_components/ui/Tooltip';

type Props = {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  closeModal?: () => void
  footerColor?: string | boolean
  isOpen: boolean
  maxWidth?: string
  closeTimeSec?: number
  width?: string | number,
  message?: string
  isError?: boolean
  customCloseIcon?: React.ReactNode
  customCloseAction?: () => void,
  disallowBackdropClose?: boolean,
  closeTooltip?: string
  allowOverflow?: boolean
};

const MainModal: React.FC<Props> = ({ children, header, closeModal, footer, footerColor, isOpen, maxWidth, closeTimeSec, message, isError, customCloseIcon, customCloseAction, disallowBackdropClose, closeTooltip, allowOverflow }) => {
  const footerColoring = typeof footerColor === 'boolean' ? 'bg-secondary dark:bg-darkmode-secondary' : footerColor ?? 'bg-transparent';

  return (
    <ModalBlurWrapper
      isOpen={isOpen}
      onClose={closeModal ?? (() => { return; })}
      disallowBackdropClose={disallowBackdropClose}
    >
      <div className={`h-fit rounded-lg bg-modal-background dark:bg-darkmode-modal-background
      text-text dark:text-darkmode-text shadow-modal dark:shadow-darkmode-modal ${maxWidth ? maxWidth : ""}
      mx-2 sm:mx-0 sm:min-w-[400px] md:min-w-[500px] lg:min-w-[600px]`}
      // style={{ width }}
      >
        <div className={`flex items-center justify-between h-fit border-b  px-3 py-2 rounded-t-lg
        dark:border-darkmode-modal-separator border-modal-separator`}>
          <div className={`mr-3 w-full flex justify-start font-normal`} >
            {header}
          </div>
          <div className="h-full">
            <Tooltip content={closeTooltip}>
              <button
                type="button"
                onClick={customCloseAction ?? closeModal}
                className={`ml-auto rounded-md border-[1px] dark:border-darkmode-modal-separator border-modal-separator p-2 text-xs font-bold
              outline-none hover:bg-secondary hover:border-opacity-0 hover:dark:bg-darkmode-secondary focus:outline-none`}>
                {customCloseIcon ?? closeTimeSec ?? "ESC"}
              </button>
            </Tooltip>
          </div>
        </div>
        {message && <div className={`
        ${isError ? 'bg-red-400/20  dark:bg-red-700/20'
            : 'bg-green-400/20 dark:bg-green-700/20'}
                  py-5 mb-5 text-center   
                  text-neutral-900 dark:text-neutral-100
                  text-sm font-bold`}>
          {isError
            ? <i className="fas fa-exclamation-triangle mr-2 text-red-500" />
            : <i className="fas fa-check-circle mr-2 text-green-500" />}
          {message}</div>}
        <div className={`pt-1 sm:pt-3  ${!header && "rounded-t-lg"} ${!footer && "rounded-b-lg py-1 sm:py-3"}`} >
          <div className={`px-3 pb-3 max-h-[calc(100vh-5rem)] ${allowOverflow ? 'overflow-y-visible' : 'overflow-y-auto'}`}>{children}</div>
        </div>

        {footer && <div className={`${footerColoring} w-full rounded-b-lg p-1 sm:p-3`}>
          {footer}
        </div>}
      </div>
    </ModalBlurWrapper>
  );
}

export default MainModal;