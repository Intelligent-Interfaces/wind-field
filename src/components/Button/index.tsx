import React, { useState, forwardRef } from 'react';
import styled, { IThemeStyledFunction } from '../../styled';
import { space, ColorProps, SpaceProps, BackgroundProps, color, get, BorderProps, border } from 'styled-system';

type ButtonProps = React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
type ButtonStyleProps = IThemeStyledFunction & ButtonProps & BorderProps & SpaceProps & ColorProps & BackgroundProps & {
  bg?: string;
  down?: boolean;
};

const ButtonInner = styled.div`
  box-sizing: border-box;
  // background: #000000;
  border: 3px solid #B78963;
  border-radius: 40px;
  height: 100%;
  width: 100%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    height: 32px;
    width: 32px;
  }
`;

// const defaultShadowPressed = `rgba(166, 171, 189, 0) 5px 5px 10px, rgb(244, 244, 244) -5px -5px 10px, rgba(166, 171, 189, 1) 3px 5px 10px inset, rgb(238, 238, 238) 4px 4px 4px inset`;
const defaultShadowPressed = `rgba(0, 0, 0, 0) 5px 5px 10px, rgb(244, 244, 244) -5px -5px 10px, rgba(0, 0, 0, 0) 3px 5px 10px inset, rgba(0, 0, 0, 0) 4px 4px 4px inset`;
// const defaultShadowRegular = `5px 5px 10px #A6ABBD, -5px -5px 10px #F4F4F4, inset 0px 1px 8px rgba(0, 0, 0, 0.05), inset 4px 4px 4px rgba(238, 238, 238, 0.5)`;
// const defaultShadowRegular = `5px 5px 10px #000000, -5px -5px 10px #F4F4F4, inset 0px 1px 8px rgba(0, 0, 0, 0.05), inset 4px 4px 4px rgba(238, 238, 238, 0.5)`;
const defaultShadowRegular = `5px 5px 10px #000000, 0px 0px 0px #000000, inset 0px 0px 0px rgba(0, 0, 0, 0), inset 4px 4px 4px rgba(0, 0, 0, 0)`;

const darkShadowPressed = `rgba(166, 171, 189, 0) 5px 5px 10px, rgb(244, 244, 244) -5px -5px 10px, rgba(0, 0, 0, 1) 3px 5px 10px inset, rgb(0, 0, 0) 4px 4px 4px inset`;
const darkShadowRegular = `5px 5px 10px #000000, -5px -5px 10px #F4F4F4, inset 0px 1px 8px rgba(166, 171, 189, 0.05), inset 4px 4px 4px rgba(166, 171, 189, 0.5)`;

// This controls the main outline of the op-1
const ButtonStyles = styled.button<ButtonStyleProps>`
  // appearance: none;
  // border: none;
  // background: #D9DCE5;
  background: #C7A079;
  // border: 3px solid #9F98F5;
  border: 3px solid #B78963;
  border-radius: 6px;
  outline: none;
  height: 100%;
  width: 100%;
  padding: 15px;

  // This controls the individual button colors
  ${ButtonInner} {
    ${props => props.bg === 'dark' ? `
      // border: 2px solid #D9DCE5;
      // border: 2px solid #C7A079;
      border: 2px solid #B78963;
      box-shadow: ${props.down ? darkShadowPressed : darkShadowRegular};
    ` : `
      // background: #DCDFE7;
      background: #B78963; //
      box-shadow: ${props.down ? defaultShadowPressed : defaultShadowRegular};
    `}

    svg {
      fill: ${props => get(props.theme.colors, props.color || 'dark')};
    }

    ${color}
  }

  ${space}
  ${border}
`;

const ButtonComponent: React.FC<ButtonStyleProps> = ({ ref, onClick, children, bg, ...rest }) => {
  const [mouseDown, setMouseDown] = useState<boolean>(false);

  return (
    <ButtonStyles bg={bg} down={mouseDown} onMouseDown={() => setMouseDown(true)} onMouseUp={() => setMouseDown(false)} onClick={onClick} {...rest}>
      <ButtonInner>
        {children}
      </ButtonInner>
    </ButtonStyles>
  );
}

type Ref = HTMLButtonElement;

export const Button = forwardRef<Ref, ButtonStyleProps>((props, ref) => (
  <ButtonComponent ref={ref} {...props} />
));
