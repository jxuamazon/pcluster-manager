// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.
import React from 'react';
import { useSelector } from 'react-redux'
import { useCollection } from '@awsui/collection-hooks';
import { setState, useState } from '../../store'

import { ListUsers, SetUserRole } from '../../model'

// UI Elements
import {
  AppLayout,
  Button,
  Container,
  Header,
  Pagination,
  Select,
  SpaceBetween,
  Table,
  TextFilter
} from "@awsui/components-react";

// Components
import EmptyState from '../../components/EmptyState';
import SideBar from '../../components/SideBar';
import Loading from '../../components/Loading'
import DateView from '../../components/DateView'

// selectors
const selectUserIndex = state => state.users.index

function userToRole(user) {
  let user_groups = new Set(user.Groups.map(group => group.GroupName));
  for(const group of ["admin", "user"])
    if(user_groups.has(group))
      return group
  return "guest";
}

function RoleSelector(props) {
  const current_group = userToRole(props.user);
  const [pending, setPending] = React.useState(false);

  return (
    <div>
      { pending ? <Loading text="Updating..." /> : 
      <Select
        expandToViewport
        placeholder="Role"
        selectedOption={{label: current_group.charAt(0).toUpperCase() + current_group.slice(1), value: current_group}}
        onChange={({ detail }) => {
          setPending(true);
          SetUserRole(props.user, detail.selectedOption.value, (user) => {setPending(false)});
        }}
        options={[
          { label: "Guest", value: "guest" },
          { label: "User", value: "user" },
          { label: "Admin", value: "admin" },
        ]}
        selectedAriaLabel="Selected"
      />
      }
    </div>
  )
}

function UserList(props) {
  const user_index = useSelector(selectUserIndex) || {};
  const usernames = Object.keys(user_index).sort();
  const users = usernames.map((username) => user_index[username]);

  const { items, actions, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
    users,
    {
      filtering: {
        empty: (
          <EmptyState
            title="No users"
            subtitle="No users to display."
            action={<></>}
          />
        ),
        noMatch: (
          <EmptyState
            title="No matches"
            subtitle="No users match the filters."
            action={
              <Button onClick={() => actions.setFiltering('')}>Clear filter</Button>}
          />
        ),
      },
      pagination: { pageSize: 10 },
      sorting: {},
      selection: {},
    }
  );

  return (
    <Table
      {...collectionProps}
      resizableColumns
      trackBy="email"
      columnDefinitions={[
        {
          id: "username",
          header: "Username",
          cell: item => item.Username,
          sortingField: "Username"
        },
        {
          id: "email",
          header: "Email",
          cell: item => item.Attributes.email || "-",
          sortingField: "Attributes.email"
        },
        {
          id: "role",
          header: "Role",
          cell: item => <RoleSelector user={item} /> || "-",
          sortingField: "Groups"
        },
        {
          id: "created",
          header: "Created",
          cell: item => <DateView date={item.UserCreateDate} /> || "-",
          sortingField: "UserCreateDate"
        }
      ]}
      loading={users === null}
      items={items}
      loadingText="Loading users..."
      pagination={<Pagination {...paginationProps} />}
      filter={
        <TextFilter
          {...filterProps}
          countText={`Results: ${filteredItemsCount}`}
          filteringAriaLabel="Filter users"
        />
      }
    />
  );
}

export default function Users() {
  const users = useSelector(selectUserIndex);
  const navigationOpen = useState(['app', 'sidebar', 'drawerOpen']);
  const refreshUsers = () => {
    ListUsers();
  }

  React.useEffect(() => {
    ListUsers();
  }, [])

  return (
    <AppLayout
      className="app-layout"
      headerSelector="#top-bar"
      navigationWidth="220px"
      toolsHide={true}
      splitHide={true}
      navigationOpen = {navigationOpen}
      onNavigationChange = {(e) => {setState(['app', 'sidebar', 'drawerOpen'], e.detail.open)}}
      content={
          <Container
            header={
              <Header
                variant="h2"
                description=""
                counter={ users && `(${Object.keys(users).length})` }
                actions={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button className="action" onClick={refreshUsers} iconName={"refresh"}>Refresh</Button>
                  </SpaceBetween>}>
                Users
              </Header>
            }>
            {users ? <UserList /> : <Loading />}
          </Container>
      }
      navigation={<SideBar />}
    />
  );
}
