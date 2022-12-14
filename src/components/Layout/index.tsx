import React from 'react';
import { Box } from '../Box';
import styled from '../../styled';

const LayoutStyles = styled(Box)`
  align-items: center;
  background: radial-gradient(51.21% 161.85% at 50.51% 50.9%, #E9CDB1 0%, #E9CDB1 100%);
  // background-image: url("https://storage.googleapis.com/blessa/mit/experiments/giphy.gif");
  background-size: cover;
  display: flex;
  justify-content: center;
  height: 100vh;
  width: 100vw;
`;

const Layout: React.FC<any> = ({ children }) => {
  return (
    <LayoutStyles>
      {children}
    </LayoutStyles>
  );
}

export { Layout };
