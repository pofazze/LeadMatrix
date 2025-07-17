import React, { useState, Fragment } from 'react';
import { Popover, Transition } from '@headlessui/react';
import styles from './LeadsM15.module.scss'; // Vamos reutilizar os mesmos estilos

// Ícone de seta (pode ser movido para um arquivo separado de ícones se preferir)
const ChevronDownIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
);

function CustomDropdown({ label, value, options, onSelect }) {
    const [isShowing, setIsShowing] = useState(false);
    let timeout;

    const handleMouseEnter = () => {
        clearTimeout(timeout);
        setIsShowing(true);
    };

    const handleMouseLeave = () => {
        timeout = setTimeout(() => {
            setIsShowing(false);
        }, 200);
    };

    const handleSelect = (option) => {
        onSelect(option);
        setIsShowing(false); // Fecha o menu ao selecionar uma opção
    };

    return (
        <Popover className={styles.dropdown}>
            <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <Popover.Button as="div" className={styles.filterBtn}>
                    {/* Mostra o valor selecionado ou o label padrão */}
                    <span>{value ? `${label}: ${value}` : label}</span>
                    <ChevronDownIcon className={styles.dropdownIcon} aria-hidden="true" />
                </Popover.Button>

                <Transition
                    show={isShowing}
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                >
                    <Popover.Panel static className={styles.dropdownMenu}>
                        <div className={styles.dropdownItemsWrapper}>
                        <div className={styles.scrollableArea}>
                            {/* Opção para limpar o filtro */}
                            <button
                                className={styles.dropdownItem}
                                onClick={() => handleSelect('')}
                            >
                                Todos(as)
                            </button>
                            
                            {/* Mapeia as opções recebidas por props */}
                            {options.map((option) => (
                                <button
                                    key={option}
                                    className={styles.dropdownItem}
                                    onClick={() => handleSelect(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        </div>
                    </Popover.Panel>
                </Transition>
            </div>
        </Popover>
    );
}

export default CustomDropdown;