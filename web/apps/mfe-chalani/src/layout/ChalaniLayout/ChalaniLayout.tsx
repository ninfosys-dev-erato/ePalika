import { Outlet, Link } from "@tanstack/react-router";
import {
  FlexGrid,
  Row,
  Column,
  Header,
  HeaderName,
  SideNav,
  SideNavItems,
  SideNavLink,
} from "@carbon/react";

export default function ChalaniLayout() {
  return (
    <FlexGrid fullWidth style={{ minHeight: "100vh" }}>
      <Row>
        <Column sm={4} md={2} lg={2}>
          <SideNav aria-label="Chalani Sections">
            <SideNavItems>
              <SideNavLink href="/">Compose</SideNavLink>
              <SideNavLink href="/review">Review</SideNavLink>
              <SideNavLink href="/approval">Approval</SideNavLink>
              <SideNavLink href="/registry">Registry</SideNavLink>
              <SideNavLink href="/signing">Signing</SideNavLink>
              <SideNavLink href="/dispatch">Dispatch</SideNavLink>
              <SideNavLink href="/delivery">Delivery</SideNavLink>
              <SideNavLink href="/archive">Archive</SideNavLink>
            </SideNavItems>
          </SideNav>
        </Column>
        <Column sm={4} md={10} lg={10}>
          <Header aria-label="Chalani Header">
            <HeaderName prefix="ePalika"> Chalani </HeaderName>
          </Header>
          <Outlet />
        </Column>
      </Row>
    </FlexGrid>
  );
}
