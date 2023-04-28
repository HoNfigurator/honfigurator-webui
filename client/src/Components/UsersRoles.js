// UsersRoles.js
import React, { useContext } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message, Tooltip } from 'antd';
import { createAxiosInstanceServer } from '../Security/axiosRequestFormat';
import { SelectedServerContext } from '../App';

const { Option } = Select;

function UserTable({ users, defaultUsers, handleEditUser, handleDeleteUser }) {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: 'Discord ID',
      dataIndex: 'discord_id',
      key: 'discord_id',
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: roles => (roles ? roles.join(', ') : '')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => {
        const isDisabled = defaultUsers.some(user => user.nickname === record.nickname);
        const tooltipTitle = isDisabled ? "Default users cannot be modified." : "Delete user";
        return (
          <Space>
            <Tooltip title={tooltipTitle}>
              <Button disabled={isDisabled} onClick={() => handleEditUser(record.discord_id)}>Edit</Button>
            </Tooltip>
            <Popconfirm
              title="Are you sure you want to delete this user?"
              onConfirm={() => handleDeleteUser(record.discord_id)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title={tooltipTitle}>
                <Button disabled={isDisabled}>Delete</Button>
              </Tooltip>
            </Popconfirm>
          </Space>
        )
      },
    },
  ];

  return (
    <Table columns={columns} dataSource={users.map(user => ({ ...user, key: user.discord_id }))} />
  );
}

function RoleTable({ roles, defaultRoles, handleEditRole, handleDeleteRole }) {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: permissions => {
        return permissions.join(', ');
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => {
        const isDisabled = defaultRoles.some(role => role.name === record.name);
        const tooltipTitle = isDisabled ? "Default roles cannot be modified." : "Delete user";
        return (
          <Space>
            <Tooltip title={tooltipTitle}>
              <Button disabled={isDisabled} onClick={() => handleEditRole(record.name)}>Edit</Button>
            </Tooltip>
            <Popconfirm
              title="Are you sure you want to delete this role?"
              onConfirm={() => handleDeleteRole(record.name)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title={tooltipTitle}>
                <Button disabled={isDisabled}>Delete</Button>
              </Tooltip>
            </Popconfirm>
          </Space>
        )
      },
    },
  ];
  return (
    <Table columns={columns} dataSource={roles.map(role => ({ ...role, key: role.name }))} />
  );
}


function UsersandRoles() {
  const [users, setUsers] = React.useState([]);
  const [roles, setRoles] = React.useState([]);
  const [permissions, setPermissions] = React.useState([]);

  const [defaultUsers, setDefaultUsers] = React.useState([]);
  const [defaultRoles, setDefaultRoles] = React.useState([]);

  const [userModalVisible, setUserModalVisible] = React.useState(false);
  const [roleModalVisible, setRoleModalVisible] = React.useState(false);

  const [userForm] = Form.useForm();
  const [roleForm] = Form.useForm();

  // Add this line to get the selected server from context
  // const selectedServer = useContext(SelectedServerContext);
  const { selectedServerValue } = useContext(SelectedServerContext);
  // console.log(`server context ${selectedServerValue}`)

  // Replace axiosInstanceServer with serverAxios using createAxiosInstanceServer
  const axiosInstanceServer = createAxiosInstanceServer(selectedServerValue);

  const handleUserOk = async () => {
    try {
      const values = await userForm.validateFields();
      const payload = {
        nickname: values.nickname,
        discord_id: values.discord_id,
        roles: values.roles,
      };
      // console.log(payload);

      if (editingUser) {
        const response = await axiosInstanceServer.post("/users/add", payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        // console.log("editing user")
        if (response.status === 201 || response.status === 200) {
          message.success('Edited user successfully.')
          setUsers(users.map((user) => (user.discord_id === editingUser.discord_id ? response.data : user)));
          setEditingUser(null);
        } else {
          message.error(`Error editing user. [${error.response.status}] ${error.response.data}`)
        }
      } else {
        // console.log("adding user");
        const response = await axiosInstanceServer.post('/users/add', payload)
          .catch((error) => {
            console.log(error);
          });
        // console.log("adding user");

        if (response.status === 201 || response.status === 200) {
          message.success("Added user successfully.")
          setUsers([...users, response.data]);
        } else {
          message.error(`Error adding user. [${error.response.status}] ${error.response.data}`)
        }
      }
      setUserModalVisible(false);
      userForm.resetFields();
    } catch (error) {
      console.log(error);
    }
  };



  const handleRoleOk = async () => {
    try {
      const values = await roleForm.validateFields();
      const payload = {
        name: values.name,
        permissions: values.permissions,
      };

      if (editingRole) {
        const response = await axiosInstanceServer.post("/roles/edit", payload);
        if (response.status === 201 || response.status === 200) {
          setRoles(roles.map((role) => (role.name === editingRole.name ? response.data : role)));
          setEditingRole(null);
          message.success("Edited role successfully.")
        } else {
          message.error(`Error editing role. [${error.response.status}] ${error.response.data}`)
        }
      } else {
        try {
          const response = await axiosInstanceServer.post('/roles/add', payload);
          if (response.status === 201 || response.status === 200) {
            setRoles([...roles, response.data]);
            message.success("Added role successfully.")
            setRoleModalVisible(false);
            roleForm.resetFields();
          } else {
            message.error(`Error adding role. [${response.status}] ${response.data}`);
          }
        } catch (error) {
          message.error(`Error adding role. [${error.response.status}] ${error.response.data}`);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };


  const handleUserCancel = () => {
    setUserModalVisible(false);
    setEditingUser(null);
    userForm.resetFields();
  };

  const handleRoleCancel = () => {
    setRoleModalVisible(false);
    setEditingRole(null);
    roleForm.resetFields();
  };


  const [editingUser, setEditingUser] = React.useState(null);

  const handleEditUser = React.useCallback(
    (discord_id) => {
      const user = users.find((user) => user.discord_id === discord_id);
      // console.log('Editing user:', user); // Add this line
      // console.log(user.discord_id);
      if (user) {
        setEditingUser(user);
        userForm.setFieldsValue({
          nickname: user.nickname,
          discord_id: user.discord_id,
          roles: user.roles,
        });
        setUserModalVisible(true);
      }
    },
    [users]
  );

  const handleDeleteUser = async discord_id => {
    try {
      const response = await axiosInstanceServer.delete(`/users/delete/${discord_id}`);
      if (response.status === 200) {
        setUsers(users.filter(user => user.discord_id !== discord_id));
        message.success("Deleted user successfully.")
      } else {
        message.error(`Error deleting user. [${error.response.status}] ${error.response.data}`)
      }
    } catch (error) {
      console.log(error);
    }
  };


  const [editingRole, setEditingRole] = React.useState(null);

  const handleEditRole = React.useCallback(
    (name) => {
      const role = roles.find((role) => role.name === name);
      if (role) {
        setEditingRole(role);
        roleForm.setFieldsValue({
          name: role.name,
          permissions: role.permissions,
        });
        setRoleModalVisible(true);
      }
    },
    [roles]
  );

  const handleDeleteRole = async name => {
    try {
      const response = await axiosInstanceServer.delete(`/roles/delete/${name}`);
      if (response.status === 200) {
        setRoles(roles.filter(role => role.name !== name));
        message.success("Role deleted successfully.");
      } else {
        message.error(`Error deleting role. [${response.status}] ${response.data}`);
      }
    } catch (error) {
      console.log(error);
    }
  };

  React.useEffect(() => {
    async function fetchData() {
      const usersResult = await axiosInstanceServer.get('/users/all');
      const rolesResult = await axiosInstanceServer.get('/roles/all');
      const permissionsResult = await axiosInstanceServer.get('/permissions/all');
      const defaultUsersResult = await axiosInstanceServer.get('/users/default');
      const defaultRolesResult = await axiosInstanceServer.get('/roles/default');

      setDefaultUsers(defaultUsersResult.data);
      setDefaultRoles(defaultRolesResult.data);
      setUsers(usersResult.data.filter(user => user.discord_id));
      setRoles(rolesResult.data);
      setPermissions(permissionsResult.data);
      console.log(defaultRoles);
      console.log(defaultUsers);
      // console.log('Users Result:', usersResult);
      // console.log('Roles Result:', rolesResult);
      // console.log('Permissions Result:', permissionsResult.data);
    }
    fetchData();
  }, []);

  const discordIdValidator = (rule, value) => {
    if (!value) {
      return Promise.reject('Please enter a Discord ID');
    }
    if (!/^[0-9]+$/.test(value)) {
      return Promise.reject(
        <span>
          Only numbers are allowed for Discord ID.{' '}
          <a
            href={process.env.REACT_APP_DISCORD_OWNER_ID_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more
          </a>
        </span>
      );
    }
    return Promise.resolve();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Users</h1>
        <Button onClick={() => setUserModalVisible(true)}>Add User</Button>
      </div>
      <UserTable
        users={users}
        defaultUsers={defaultUsers}
        handleEditUser={handleEditUser}
        handleDeleteUser={handleDeleteUser}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Roles</h1>
        <Button onClick={() => setRoleModalVisible(true)}>Add Role</Button>
      </div>
      <RoleTable
        roles={roles}
        defaultRoles={defaultRoles}
        handleEditRole={handleEditRole}
        handleDeleteRole={handleDeleteRole}
      />
      <Modal
        title={editingUser ? 'Edit User' : 'Add User'}
        visible={userModalVisible}
        onOk={handleUserOk}
        onCancel={handleUserCancel}
        okText={editingUser ? 'Update' : 'Add'}
        cancelText="Cancel"
      >
        <Form form={userForm} layout="vertical">
          <Form.Item
            label="Nickname"
            name="nickname"
            rules={[{ required: true, message: 'Please enter a nickname' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Discord ID"
            name="discord_id"
            rules={[
              {
                required: true,
                validator: discordIdValidator,
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Roles"
            name="roles"
            rules={[{ required: true, message: 'Please select at least one role' }]}
          >
            <Select mode="multiple">
              {roles.map(role => (
                <Option key={role.id} value={role.name}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={editingRole ? 'Edit Role' : 'Add Role'}
        visible={roleModalVisible}
        onOk={handleRoleOk}
        onCancel={handleRoleCancel}
        okText={editingRole ? 'Update' : 'Add'}
        cancelText="Cancel"
      >
        <Form form={roleForm} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Permissions"
            name="permissions"
            rules={[{ required: true, message: 'Please select permissions' }]}
          >
            <Select mode="multiple">
              {permissions.map(permission => (
                <Option key={permission.name} value={permission.name}>
                  {permission.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
export { UserTable };
export default UsersandRoles;
