package com.ncc.neon.connect

import com.ncc.neon.cache.ImmutableValueCache
import org.springframework.beans.factory.annotation.Autowired

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ConcurrentMap

/*
 * ************************************************************************
 * Copyright (c), 2013 Next Century Corporation. All Rights Reserved.
 *
 * This software code is the exclusive property of Next Century Corporation and is
 * protected by United States and International laws relating to the protection
 * of intellectual property.  Distribution of this software code by or to an
 * unauthorized party, or removal of any of these notices, is strictly
 * prohibited and punishable by law.
 *
 * UNLESS PROVIDED OTHERWISE IN A LICENSE AGREEMENT GOVERNING THE USE OF THIS
 * SOFTWARE, TO WHICH YOU ARE AN AUTHORIZED PARTY, THIS SOFTWARE CODE HAS BEEN
 * ACQUIRED BY YOU "AS IS" AND WITHOUT WARRANTY OF ANY KIND.  ANY USE BY YOU OF
 * THIS SOFTWARE CODE IS AT YOUR OWN RISK.  ALL WARRANTIES OF ANY KIND, EITHER
 * EXPRESSED OR IMPLIED, INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE, ARE HEREBY EXPRESSLY
 * DISCLAIMED.
 *
 * PROPRIETARY AND CONFIDENTIAL TRADE SECRET MATERIAL NOT FOR DISCLOSURE OUTSIDE
 * OF NEXT CENTURY CORPORATION EXCEPT BY PRIOR WRITTEN PERMISSION AND WHEN
 * RECIPIENT IS UNDER OBLIGATION TO MAINTAIN SECRECY.
 *
 * 
 * @author tbrooks
 */

/**
 * This holds the connection information for the application.
 */

class ConnectionManager {

    private final ConcurrentMap<ConnectionInfo, ConnectionClientFactory> connectionCache = [:] as ConcurrentHashMap
    private final ImmutableValueCache<String, ConnectionInfo> connections = new ImmutableValueCache<String, ConnectionInfo>()

    @Autowired
    SessionConnection sessionConnection

    /** the default connection used if the session is not explicitly connected to one */
    private ConnectionInfo defaultConnection


    ConnectionInfo getConnectionById(String connectionId) {
        return connections.get(connectionId)
    }

    void connect(ConnectionInfo info) {
        sessionConnection.connectionInfo = info
        connectionCache.putIfAbsent(info, createClientFactory(info))
        connections.add("${info.dataSource.name()}@${info.connectionUrl}", info)
    }

    void initConnectionManager(ConnectionInfo info){
        connectionCache.clear()
        if(info){
            connectionCache.put(info, createClientFactory(info))
        }
        defaultConnection = info

    }

    ConnectionClient getConnectionClient(){
        return createConnectionClient(getCurrentConnectionInfo())
    }

    ConnectionClient getDefaultConnectionClient() {
        return createConnectionClient(defaultConnection)
    }

    ConnectionInfo getCurrentConnectionInfo(){
        ConnectionInfo connection = sessionConnection.connectionInfo ?: defaultConnection
        if ( !connection ) {
            throw new NeonConnectionException("No default or session connections exist")
        }
        return connection
    }

    private ConnectionClient createConnectionClient(ConnectionInfo info) {
        ConnectionClientFactory factory = connectionCache.get(info)
        return factory.createConnectionClient(info)
    }

    private ConnectionClientFactory createClientFactory(ConnectionInfo connectionInfo) {
        if (connectionInfo.dataSource == DataSources.mongo) {
            return new MongoConnectionClientFactory()
        }
        if (connectionInfo.dataSource == DataSources.hive) {
            return new JdbcConnectionClientFactory("org.apache.hive.jdbc.HiveDriver", "hive2")
        }
        throw new NeonConnectionException("There must be a data source to which to connect.")
    }

}
