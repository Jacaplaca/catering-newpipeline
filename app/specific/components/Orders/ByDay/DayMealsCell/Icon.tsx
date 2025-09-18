import { type FunctionComponent } from 'react';

const Icon: FunctionComponent<{ loading?: boolean, icon: string, iconClass?: string }> = ({ loading, icon, iconClass }) => <i className={`fa-solid ${loading ?
    'fa-spinner-third fa-spin text-secondary dark:text-darkmode-secondary-accent'
    : icon} 
text-xl w-6 text-secondary-accent dark:text-darkmode-secondary 
hover:text-secondary dark:hover:text-darkmode-secondary-accent
${iconClass ?? ''}
`}></i>

export default Icon;
