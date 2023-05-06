import { React, useContext } from 'react';
import { Layout, Row, Col, Dropdown, Menu, Button, Avatar, Tooltip } from 'antd';
import { UserOutlined, LogoutOutlined, DownOutlined } from '@ant-design/icons';
import { SelectedServerContext } from './App';
import './Header.css'

const { Header } = Layout;

const CustomHeader = ({
    logoSrc,
    logoAlt,
    userInfo,
    userRolePermissions,
    dropdownMenu,
    isAuthenticated,
    serverStatusIndicator,
    selectedServerStatus,
    onLogout
}) => {
    // Conditional rendering of the user's display name
    const displayName = userInfo ? userInfo.discordName : "Loading...";

    // Conditional rendering of the user's roles
    const roles = userRolePermissions && Array.isArray(userRolePermissions.roles) ? userRolePermissions.roles.join(', ') : "Loading...";
    const permissions = userRolePermissions && Array.isArray(userRolePermissions.perms) ? userRolePermissions.perms.join(', ') : "Loading...";

    const { selectedServerLabel, selectedServerValue, selectedServerPort } = useContext(SelectedServerContext);

    return (
        <Header className="header-container">
            <div className="header-content">
                <div className="header-title">
                    <img src={logoSrc} alt={logoAlt} className="header-logo" />
                    <h1 className="header-title-text">
                        HoNfigurator
                        <span className="header-beta-label"> beta</span>
                    </h1>
                </div>
                {isAuthenticated && (
                    <div className="header-dropdown">
                        <Tooltip
                            title={
                                <>
                                    <div>Roles: {roles}</div>
                                    <div>Permissions: {permissions}</div>
                                </>
                            }
                            placement="bottomRight"
                        >
                            <Avatar
                                size="small"
                                icon={<UserOutlined />}
                                style={{ backgroundColor: '#87d068', marginRight: '8px', cursor: 'pointer' }}
                            />
                        </Tooltip>
                        <span className="user-roles-text" style={{ marginRight: '16px' }}>
                            {displayName}
                        </span>
                        <Dropdown overlay={dropdownMenu} trigger={['click']}>
                            <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
                                {selectedServerLabel ? `${selectedServerLabel}` : "No connected servers."}
                                {serverStatusIndicator} <DownOutlined />
                            </a>
                        </Dropdown>
                        <Tooltip title="Logout">
                            <Button
                                type="text"
                                className="logout-button"
                                icon={<LogoutOutlined />}
                                style={{ marginLeft: '16px' }}
                                onClick={onLogout}
                            />
                        </Tooltip>
                    </div>
                )}
            </div>
        </Header>
    );

};

export default CustomHeader;